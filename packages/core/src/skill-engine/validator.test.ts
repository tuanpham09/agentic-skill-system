import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { SkillValidator } from './validator.js';

const VALID_SKILL_JSON = JSON.stringify({
  name: 'test-skill',
  version: '1.0.0',
  description: 'A test skill for validation purposes',
  author: 'tester',
  license: 'MIT',
  keywords: ['test', 'validation'],
  agentTypes: ['all'],
  minCliVersion: '1.0.0',
  dependencies: {},
});

const VALID_SKILL_MD = `---
name: test-skill
description: A test skill
---
# Test Skill

> **Agent context:** Use this skill for testing.

## Step 1 — Do the thing

Do it.

## Quality Checklist

- [ ] Thing done
`;

function makeSkillDir(base: string, files: Record<string, string>): string {
  const dir = join(base, `skill-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(dir, name), content, 'utf-8');
  }
  return dir;
}

describe('SkillValidator', () => {
  let tmpDir: string;
  let validator: SkillValidator;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `validator-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
    validator = new SkillValidator();
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // ── Happy path ──────────────────────────────────────────────────────────────

  it('returns valid:true for a well-formed skill', () => {
    const dir = makeSkillDir(tmpDir, {
      'skill.json': VALID_SKILL_JSON,
      'SKILL.md': VALID_SKILL_MD,
    });
    const result = validator.validate(dir);
    expect(result.valid).toBe(true);
  });

  // ── Missing files ───────────────────────────────────────────────────────────

  it('reports error when skill.json is missing', () => {
    const dir = makeSkillDir(tmpDir, { 'SKILL.md': VALID_SKILL_MD });
    const result = validator.validate(dir);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes('skill.json'))).toBe(true);
    }
  });

  it('reports error when SKILL.md is missing', () => {
    const dir = makeSkillDir(tmpDir, { 'skill.json': VALID_SKILL_JSON });
    const result = validator.validate(dir);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes('SKILL.md'))).toBe(true);
    }
  });

  it('reports both errors when both files are missing', () => {
    mkdirSync(join(tmpDir, 'empty'), { recursive: true });
    const result = validator.validate(join(tmpDir, 'empty'));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    }
  });

  // ── skill.json validation ───────────────────────────────────────────────────

  it('reports error for invalid skill name (PascalCase)', () => {
    const dir = makeSkillDir(tmpDir, {
      'skill.json': VALID_SKILL_JSON.replace('"test-skill"', '"TestSkill"'),
      'SKILL.md': VALID_SKILL_MD,
    });
    const result = validator.validate(dir);
    expect(result.valid).toBe(false);
  });

  it('reports error for invalid semver', () => {
    const dir = makeSkillDir(tmpDir, {
      'skill.json': VALID_SKILL_JSON.replace('"1.0.0"', '"v1.0"'),
      'SKILL.md': VALID_SKILL_MD,
    });
    const result = validator.validate(dir);
    expect(result.valid).toBe(false);
  });

  it('reports error for description over 120 chars', () => {
    const longDesc = 'A'.repeat(121);
    const dir = makeSkillDir(tmpDir, {
      'skill.json': VALID_SKILL_JSON.replace(
        'A test skill for validation purposes',
        longDesc
      ),
      'SKILL.md': VALID_SKILL_MD,
    });
    const result = validator.validate(dir);
    expect(result.valid).toBe(false);
  });

  it('reports error for malformed JSON in skill.json', () => {
    const dir = makeSkillDir(tmpDir, {
      'skill.json': '{ invalid json !!!',
      'SKILL.md': VALID_SKILL_MD,
    });
    const result = validator.validate(dir);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes('not valid JSON'))).toBe(true);
    }
  });

  // ── SKILL.md validation ─────────────────────────────────────────────────────

  it('reports error when Agent context block is missing', () => {
    const noContext = VALID_SKILL_MD.replace('> **Agent context:** Use this skill for testing.', '');
    const dir = makeSkillDir(tmpDir, {
      'skill.json': VALID_SKILL_JSON,
      'SKILL.md': noContext,
    });
    const result = validator.validate(dir);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes('Agent context'))).toBe(true);
    }
  });

  it('reports error when Quality Checklist section is missing', () => {
    const noChecklist = VALID_SKILL_MD.replace('## Quality Checklist\n\n- [ ] Thing done', '');
    const dir = makeSkillDir(tmpDir, {
      'skill.json': VALID_SKILL_JSON,
      'SKILL.md': noChecklist,
    });
    const result = validator.validate(dir);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes('Quality Checklist'))).toBe(true);
    }
  });

  it('reports error when SKILL.md has no frontmatter', () => {
    const noFrontmatter = VALID_SKILL_MD.replace(/^---[\s\S]*?---\n/, '');
    const dir = makeSkillDir(tmpDir, {
      'skill.json': VALID_SKILL_JSON,
      'SKILL.md': noFrontmatter,
    });
    const result = validator.validate(dir);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes('frontmatter'))).toBe(true);
    }
  });

  // ── validateMany ────────────────────────────────────────────────────────────

  it('validateMany returns results for all dirs', () => {
    const dir1 = makeSkillDir(tmpDir, {
      'skill.json': VALID_SKILL_JSON,
      'SKILL.md': VALID_SKILL_MD,
    });
    const dir2 = makeSkillDir(tmpDir, { 'SKILL.md': VALID_SKILL_MD }); // missing skill.json

    const results = validator.validateMany([dir1, dir2]);
    expect(results.get(dir1)?.valid).toBe(true);
    expect(results.get(dir2)?.valid).toBe(false);
  });
});
