import { Router } from 'express';
import { db } from '../db/connection.js';
import { skills, users } from '../db/schema.js';
import { eq, like, or } from 'drizzle-orm';

export const searchRouter = Router();

// GET /api/v1/search?q=tdd&limit=10
searchRouter.get('/', (req, res) => {
  const query = String(req.query['q'] ?? '').trim();
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query['limit'] ?? '10'))));

  if (!query) {
    res.status(400).json({ error: 'q parameter required', code: 'VALIDATION_FAILED' });
    return;
  }

  const pattern = `%${query}%`;

  const rows = db
    .select({
      name: skills.name,
      version: skills.latestVersion,
      description: skills.description,
      downloads: skills.downloads,
      updatedAt: skills.updatedAt,
      author: users.username,
    })
    .from(skills)
    .innerJoin(users, eq(users.id, skills.authorId))
    .where(
      or(
        like(skills.name, pattern),
        like(skills.description, pattern),
        like(skills.keywords, pattern)
      )
    )
    .limit(limit)
    .all();

  res.json({
    results: rows.map((r) => ({
      name: r.name,
      version: r.version,
      description: r.description,
      author: r.author,
      downloads: r.downloads ?? 0,
      score: r.name.includes(query) ? 1.0 : 0.7,
      updatedAt: r.updatedAt,
    })),
    total: rows.length,
  });
});
