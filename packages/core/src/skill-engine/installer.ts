import {
  existsSync,
  mkdirSync,
  cpSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import { join, homedir } from 'path';
import type { InstallOptions, InstallResult } from '../types/index.js';
import { SkillValidator } from './validator.js';
import { SkillLoader } from './loader.js';
import { ConfigLoader } from '../config/loader.js';

const GLOBAL_SKILLS_DIR = join(homedir(), '.agentic-skills', 'skills');

export class SkillInstaller {
  private validator = new SkillValidator();
  private loader = new SkillLoader();
  private configLoader = new ConfigLoader();

  /**
   * Install a skill from a local directory path.
   * For registry installs, the caller downloads + extracts to a temp dir first,
   * then calls this method.
   */
  installFromPath(
    skillDir: string,
    projectRoot: string,
    options: InstallOptions = {}
  ): InstallResult {
    // Validate before installing
    const validation = this.validator.validate(skillDir);
    if (!validation.valid) {
      throw new Error(
        `Skill validation failed:\n${validation.errors.map((e) => `  • ${e}`).join('\n')}`
      );
    }

    const meta = this.loader.loadMeta(skillDir);
    const scope = options.local ? 'local' : 'global';

    let destPath: string;
    if (scope === 'local') {
      destPath = join(projectRoot, '.skills', meta.name);
    } else {
      destPath = join(GLOBAL_SKILLS_DIR, `${meta.name}@${meta.version}`);
    }

    // Copy skill directory
    mkdirSync(destPath, { recursive: true });
    cpSync(skillDir, destPath, { recursive: true });

    // Update .agentic.json to register the skill
    this.registerSkill(projectRoot, meta.name, meta.version);

    return {
      name: meta.name,
      version: meta.version,
      path: destPath,
      scope,
    };
  }

  private registerSkill(projectRoot: string, name: string, version: string): void {
    const configPath = join(projectRoot, '.agentic.json');
    let config: Record<string, unknown> = {};

    if (existsSync(configPath)) {
      try {
        config = JSON.parse(readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
      } catch {
        // Start fresh if corrupt
      }
    }

    const skills = (config['skills'] as Record<string, string>) ?? {};
    skills[name] = version;
    config['skills'] = skills;

    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  }
}
