import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { SkillResolver } from './resolver.js';

const SKILL_JSON = JSON.stringify({
  name: 'test-skill',
  version: '1.0.0',
  description: 'Test',
  author: 'test',
  license: 'MIT',
  keywords: ['test'],
  agentTypes: ['all'],
  minCliVersion: '1.0.0',
  dependencies: {},
});

function createFakeSkill(dir: string, name = 'test-skill'): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'SKILL.md'), '# Test\n> **Agent context:** test\n## Step 1\nDo it.\n## Quality Checklist\n- [ ] Done\n');
  writeFileSync(join(dir, 'skill.json'), SKILL_JSON.replace('"test-skill"', `"${name}"`));
}

describe('SkillResolver', () => {
  let tmpDir: string;
  let projectRoot: string;
  let bundledDir: string;
  let globalDir: string;
  let resolver: SkillResolver;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `resolver-test-${Date.now()}`);
    projectRoot = join(tmpDir, 'project');
    bundledDir = join(tmpDir, 'bundled');
    globalDir = join(tmpDir, 'global-skills');
    mkdirSync(projectRoot, { recursive: true });
    mkdirSync(bundledDir, { recursive: true });
    mkdirSync(globalDir, { recursive: true });
    resolver = new SkillResolver(globalDir);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns null when skill is not installed anywhere', () => {
    const result = resolver.resolve('missing-skill', projectRoot, bundledDir);
    expect(result).toBeNull();
  });

  it('resolves from bundled dir as fallback', () => {
    createFakeSkill(join(bundledDir, 'test-skill'));
    const result = resolver.resolve('test-skill', projectRoot, bundledDir);
    expect(result).not.toBeNull();
    expect(result?.scope).toBe('bundled');
  });

  it('resolves from global dir (higher priority than bundled)', () => {
    createFakeSkill(join(bundledDir, 'test-skill'));
    createFakeSkill(join(globalDir, 'test-skill@1.0.0'));
    const result = resolver.resolve('test-skill', projectRoot, bundledDir);
    expect(result?.scope).toBe('global');
  });

  it('resolves from local dir (highest priority)', () => {
    createFakeSkill(join(bundledDir, 'test-skill'));
    createFakeSkill(join(globalDir, 'test-skill@1.0.0'));
    createFakeSkill(join(projectRoot, '.skills', 'test-skill'));
    const result = resolver.resolve('test-skill', projectRoot, bundledDir);
    expect(result?.scope).toBe('local');
  });

  it('listInstalled() returns summaries for all installed skills', () => {
    createFakeSkill(join(bundledDir, 'test-skill'));
    const summaries = resolver.listInstalled(projectRoot, ['test-skill'], bundledDir);
    expect(summaries.length).toBe(1);
    expect(summaries[0]?.name).toBe('test-skill');
    expect(summaries[0]?.scope).toBe('bundled');
  });

  it('listInstalled() skips skills that cannot be resolved', () => {
    const summaries = resolver.listInstalled(projectRoot, ['does-not-exist'], bundledDir);
    expect(summaries.length).toBe(0);
  });
});
