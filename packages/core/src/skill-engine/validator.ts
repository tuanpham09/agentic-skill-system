import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import type { ValidationResult } from '../types/index.js';

const skillMetaSchema = z.object({
  name: z
    .string()
    .regex(/^(@[a-z][a-z0-9-]*\/)?[a-z][a-z0-9-]*$/, 'Must be kebab-case (optionally @org/name)'),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+/, 'Must be semver (e.g. 1.0.0)'),
  description: z
    .string()
    .min(10, 'Description too short (min 10 chars)')
    .max(120, 'Description too long (max 120 chars)'),
  author: z.string().min(1, 'Author is required'),
  license: z.string().min(1, 'License is required'),
  keywords: z
    .array(z.string())
    .min(1, 'At least 1 keyword required')
    .max(10, 'Max 10 keywords'),
  agentTypes: z
    .array(z.enum(['claude', 'opencode', 'copilot', 'codex', 'all']))
    .min(1, 'At least 1 agent type required'),
  minCliVersion: z
    .string()
    .regex(/^\d+\.\d+\.\d+/, 'Must be semver'),
  dependencies: z.record(z.string()).default({}),
  triggers: z.array(z.string()).optional(),
});

const REQUIRED_SKILL_MD_PATTERNS = [
  { pattern: /^#\s+.+/m, message: 'SKILL.md must have an H1 title (# Title)' },
  {
    pattern: />\s*\*\*Agent context:\*\*/,
    message: 'SKILL.md must have a "> **Agent context:**" block',
  },
  {
    pattern: /^##\s+/m,
    message: 'SKILL.md must have at least one H2 section (## Section)',
  },
  {
    pattern: /##\s+Quality Checklist/,
    message: 'SKILL.md must have a "## Quality Checklist" section',
  },
];

export class SkillValidator {
  validate(skillDir: string): ValidationResult {
    const errors: string[] = [];

    // 1. skill.json must exist and be valid
    const metaPath = join(skillDir, 'skill.json');
    if (!existsSync(metaPath)) {
      errors.push('Missing skill.json — every skill must have a skill.json metadata file');
      // Can't continue without meta
      return { valid: false, errors };
    }

    try {
      const raw = JSON.parse(readFileSync(metaPath, 'utf-8'));
      const result = skillMetaSchema.safeParse(raw);
      if (!result.success) {
        result.error.issues.forEach((i) => {
          errors.push(`skill.json [${i.path.join('.')}]: ${i.message}`);
        });
      }
    } catch {
      errors.push('skill.json is not valid JSON');
    }

    // 2. SKILL.md must exist and have required sections
    const skillMdPath = join(skillDir, 'SKILL.md');
    if (!existsSync(skillMdPath)) {
      errors.push('Missing SKILL.md — every skill must have a SKILL.md instruction file');
    } else {
      const content = readFileSync(skillMdPath, 'utf-8');

      for (const { pattern, message } of REQUIRED_SKILL_MD_PATTERNS) {
        if (!pattern.test(content)) {
          errors.push(message);
        }
      }

      // Check frontmatter exists
      if (!content.startsWith('---')) {
        errors.push('SKILL.md must start with YAML frontmatter (---) for skill discovery');
      }
    }

    return errors.length === 0 ? { valid: true } : { valid: false, errors };
  }

  validateMany(skillDirs: string[]): Map<string, ValidationResult> {
    const results = new Map<string, ValidationResult>();
    for (const dir of skillDirs) {
      results.set(dir, this.validate(dir));
    }
    return results;
  }
}
