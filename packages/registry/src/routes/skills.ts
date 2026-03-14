import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { createHash, randomUUID } from 'crypto';
import { existsSync, mkdirSync, writeFileSync, createReadStream } from 'fs';
import { join } from 'path';
import { db } from '../db/connection.js';
import { skills, skillVersions, users } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authMiddleware, type AuthedRequest } from '../middleware/auth.js';

export const skillsRouter = Router();

const STORAGE_PATH = process.env['STORAGE_PATH'] ?? './bundles';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// ─── GET /api/v1/skills — list skills ────────────────────────────────────────
skillsRouter.get('/', (_req, res) => {
  const page = Math.max(1, parseInt(String(_req.query['page'] ?? '1')));
  const limit = Math.min(50, Math.max(1, parseInt(String(_req.query['limit'] ?? '20'))));
  const offset = (page - 1) * limit;

  const rows = db
    .select({
      name: skills.name,
      latestVersion: skills.latestVersion,
      description: skills.description,
      downloads: skills.downloads,
      updatedAt: skills.updatedAt,
      author: users.username,
    })
    .from(skills)
    .innerJoin(users, eq(users.id, skills.authorId))
    .limit(limit)
    .offset(offset)
    .all();

  const total = db.select({ count: skills.id }).from(skills).all().length;

  res.json({
    skills: rows.map((r) => ({
      name: r.name,
      version: r.latestVersion,
      description: r.description,
      author: r.author,
      downloads: r.downloads ?? 0,
      updatedAt: r.updatedAt,
    })),
    total,
    page,
    limit,
  });
});

// ─── GET /api/v1/skills/:name/:version — resolve a skill ─────────────────────
skillsRouter.get('/:name/:version', (req, res) => {
  const { name, version } = req.params as { name: string; version: string };

  const skill = db.select().from(skills).where(eq(skills.name, name)).get();
  if (!skill) {
    res.status(404).json({ error: `Skill '${name}' not found`, code: 'SKILL_NOT_FOUND' });
    return;
  }

  const targetVersion = version === 'latest' ? skill.latestVersion : version;

  const sv = db
    .select()
    .from(skillVersions)
    .where(and(eq(skillVersions.skillId, skill.id), eq(skillVersions.version, targetVersion)))
    .get();

  if (!sv) {
    res.status(404).json({
      error: `Version '${targetVersion}' of skill '${name}' not found`,
      code: 'SKILL_NOT_FOUND',
    });
    return;
  }

  // Increment download count
  db.update(skills)
    .set({ downloads: (skill.downloads ?? 0) + 1 })
    .where(eq(skills.id, skill.id))
    .run();

  res.json({
    name: skill.name,
    version: sv.version,
    meta: JSON.parse(sv.meta) as unknown,
    downloadUrl: sv.bundleUrl,
    integrity: sv.integrity,
  });
});

// ─── POST /api/v1/skills — publish a skill ────────────────────────────────────
skillsRouter.post(
  '/',
  (req, res, next) => authMiddleware(req as AuthedRequest, res, next),
  upload.single('bundle'),
  (req, res) => {
    const authedReq = req as AuthedRequest;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'bundle file required', code: 'VALIDATION_FAILED' });
      return;
    }

    // Parse skill.json from the bundle (for now we expect metadata in form fields too)
    const metaRaw = req.body as Record<string, unknown>;
    const metaSchema = z.object({
      name: z.string().regex(/^(@[a-z][a-z0-9-]*\/)?[a-z][a-z0-9-]*$/),
      version: z.string().regex(/^\d+\.\d+\.\d+/),
      description: z.string().max(120),
    });

    const metaParsed = metaSchema.safeParse(metaRaw);
    if (!metaParsed.success) {
      res.status(400).json({
        error: metaParsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
        code: 'VALIDATION_FAILED',
      });
      return;
    }

    const { name, version } = metaParsed.data;

    // Check version doesn't already exist
    const existingSkill = db.select().from(skills).where(eq(skills.name, name)).get();
    if (existingSkill) {
      const existingVersion = db
        .select()
        .from(skillVersions)
        .where(and(eq(skillVersions.skillId, existingSkill.id), eq(skillVersions.version, version)))
        .get();
      if (existingVersion) {
        res.status(409).json({
          error: `Version ${version} of '${name}' already published. Bump the version in skill.json.`,
          code: 'VERSION_EXISTS',
        });
        return;
      }
    }

    // Store bundle file
    if (!existsSync(STORAGE_PATH)) mkdirSync(STORAGE_PATH, { recursive: true });
    const bundleFilename = `${name}-${version}.zip`;
    const bundlePath = join(STORAGE_PATH, bundleFilename);
    writeFileSync(bundlePath, file.buffer);

    const integrity = `sha256-${createHash('sha256').update(file.buffer).digest('hex')}`;
    const baseUrl = process.env['BASE_URL'] ?? 'http://localhost:3000';
    const bundleUrl = `${baseUrl}/bundles/${bundleFilename}`;
    const now = new Date().toISOString();

    if (!existingSkill) {
      // New skill — insert skill + version
      const skillId = randomUUID();
      db.insert(skills).values({
        id: skillId,
        name,
        authorId: authedReq.userId!,
        latestVersion: version,
        description: metaParsed.data.description,
        keywords: JSON.stringify([]),
        createdAt: now,
        updatedAt: now,
      }).run();

      db.insert(skillVersions).values({
        id: randomUUID(),
        skillId,
        version,
        bundleUrl,
        integrity,
        meta: JSON.stringify(metaRaw),
        publishedAt: now,
      }).run();
    } else {
      // Existing skill — add version, update latest
      db.update(skills)
        .set({ latestVersion: version, updatedAt: now })
        .where(eq(skills.id, existingSkill.id))
        .run();

      db.insert(skillVersions).values({
        id: randomUUID(),
        skillId: existingSkill.id,
        version,
        bundleUrl,
        integrity,
        meta: JSON.stringify(metaRaw),
        publishedAt: now,
      }).run();
    }

    res.status(201).json({
      name,
      version,
      url: `${baseUrl}/api/v1/skills/${name}/${version}`,
    });
  }
);
