import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { SkillSummary } from '../types/index.js';
import { SkillLoader } from './loader.js';

export const GLOBAL_SKILLS_DIR = join(homedir(), '.agentic-skills', 'skills');

export class SkillResolver {
  private loader = new SkillLoader();
  private globalSkillsDir: string;

  constructor(globalSkillsDir?: string) {
    this.globalSkillsDir = globalSkillsDir ?? GLOBAL_SKILLS_DIR;
  }

  /**
   * Resolve skill directory path using priority:
   * 1. Local: .skills/{name}/ (highest priority)
   * 2. Global: ~/.agentic-skills/skills/{name}@{version}/
   * 3. Bundled: {cliPackageRoot}/skills/{name}/ (offline fallback)
   */
  resolve(
    skillName: string,
    projectRoot: string,
    bundledSkillsDir?: string
  ): { path: string; scope: SkillSummary['scope'] } | null {
    // 1. Local override
    const localPath = join(projectRoot, '.skills', skillName);
    if (existsSync(join(localPath, 'SKILL.md'))) {
      return { path: localPath, scope: 'local' };
    }

    // 2. Global cache (find latest matching version)
    if (existsSync(this.globalSkillsDir)) {
      const match = this.findLatestVersionDir(skillName, this.globalSkillsDir);
      if (match) return { path: match, scope: 'global' };
    }

    // 3. Bundled skills (offline mode)
    if (bundledSkillsDir) {
      const bundledPath = join(bundledSkillsDir, skillName);
      if (existsSync(join(bundledPath, 'SKILL.md'))) {
        return { path: bundledPath, scope: 'bundled' };
      }
    }

    return null;
  }

  /**
   * List all resolvable skills for a project (for session context)
   */
  listInstalled(
    projectRoot: string,
    installedSkillNames: string[],
    bundledSkillsDir?: string
  ): SkillSummary[] {
    const summaries: SkillSummary[] = [];

    for (const name of installedSkillNames) {
      const resolved = this.resolve(name, projectRoot, bundledSkillsDir);
      if (resolved) {
        try {
          summaries.push(this.loader.toSummary(resolved.path, resolved.scope));
        } catch {
          // Skip skills that fail to load
        }
      }
    }

    return summaries;
  }

  private findLatestVersionDir(skillName: string, skillsDir: string): string | null {
    try {
      const entries = readdirSync(skillsDir)
        .filter((d) => d === skillName || d.startsWith(`${skillName}@`))
        .sort()
        .reverse();
      if (entries.length > 0 && entries[0]) {
        return join(skillsDir, entries[0]);
      }
    } catch {
      // directory doesn't exist or can't be read
    }
    return null;
  }
}
