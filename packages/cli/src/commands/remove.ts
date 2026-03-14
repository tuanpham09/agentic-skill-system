import { existsSync, rmSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { AppContext } from '@agentic-skill/core';
import { SkillResolver } from '@agentic-skill/core';
import { logger } from '../utils/logger.js';
import { getBundledSkillsDir } from '../utils/context.js';

interface RemoveOptions {
  global?: boolean;
}

export function removeCommand(
  skillName: string,
  options: RemoveOptions,
  ctx: AppContext
): void {
  if (!skillName) {
    logger.error('Skill name required.');
    logger.hint('Usage: agentic-skill remove <skill-name>');
    process.exit(1);
  }

  const resolver = new SkillResolver();
  const bundledDir = getBundledSkillsDir();
  const resolved = resolver.resolve(skillName, ctx.projectRoot, bundledDir);

  if (!resolved) {
    logger.error(`Skill '${skillName}' is not installed.`);
    logger.hint("Run 'agentic-skill list' to see installed skills.");
    process.exit(1);
  }

  // Prevent removing bundled skills
  if (resolved.scope === 'bundled') {
    logger.error(`Cannot remove '${skillName}' — it is a bundled skill.`);
    logger.hint('Bundled skills are part of the CLI package and cannot be removed.');
    process.exit(1);
  }

  // Remove the skill directory
  rmSync(resolved.path, { recursive: true, force: true });
  logger.success(`Removed ${skillName} [${resolved.scope}] from ${resolved.path}`);

  // Unregister from .agentic.json
  const configPath = join(ctx.projectRoot, '.agentic.json');
  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
      const skills = (config['skills'] as Record<string, string>) ?? {};
      delete skills[skillName];
      config['skills'] = skills;
      writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
      logger.success('Updated .agentic.json');
    } catch {
      logger.warn('Could not update .agentic.json — please remove the skill entry manually.');
    }
  }

  logger.hint("Run 'agentic-skill session start' to refresh your IDE context.");
}
