import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { SkillMeta, SkillSummary } from '../types/index.js';

export class SkillLoader {
  loadMeta(skillDir: string): SkillMeta {
    const metaPath = join(skillDir, 'skill.json');
    if (!existsSync(metaPath)) {
      throw new Error(`skill.json not found at ${metaPath}`);
    }
    try {
      return JSON.parse(readFileSync(metaPath, 'utf-8')) as SkillMeta;
    } catch {
      throw new Error(`Failed to parse skill.json at ${metaPath}`);
    }
  }

  loadContent(skillDir: string): string {
    const skillMdPath = join(skillDir, 'SKILL.md');
    if (!existsSync(skillMdPath)) {
      throw new Error(`SKILL.md not found at ${skillMdPath}`);
    }
    return readFileSync(skillMdPath, 'utf-8');
  }

  toSummary(skillDir: string, scope: SkillSummary['scope']): SkillSummary {
    const meta = this.loadMeta(skillDir);
    return {
      name: meta.name,
      version: meta.version,
      description: meta.description,
      scope,
      path: skillDir,
    };
  }
}
