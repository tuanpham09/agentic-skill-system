import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { SkillLoader, ConfigLoader } from '@agentic-skill/core';
import type { AppContext, SkillSummary } from '@agentic-skill/core';
import { logger } from '../utils/logger.js';
import { getBundledSkillsDir } from '../utils/context.js';

interface ListOptions {
  global?: boolean;
  local?: boolean;
  json?: boolean;
}

export async function listCommand(options: ListOptions, ctx: AppContext): Promise<void> {
  const loader = new SkillLoader();
  const configLoader = new ConfigLoader();
  const skills: SkillSummary[] = [];

  const projectHasConfig = configLoader.exists(ctx.projectRoot);
  const installedNames = projectHasConfig
    ? Object.keys(ctx.config.skills)
    : [];

  // --- Local skills (.skills/) ---
  if (!options.global) {
    const localDir = join(ctx.projectRoot, '.skills');
    if (existsSync(localDir)) {
      for (const name of readdirSync(localDir)) {
        const skillDir = join(localDir, name);
        try {
          skills.push(loader.toSummary(skillDir, 'local'));
        } catch { /* skip invalid */ }
      }
    }
  }

  // --- Global skills (~/.agentic-skills/skills/) ---
  if (!options.local) {
    const globalDir = join(homedir(), '.agentic-skills', 'skills');
    if (existsSync(globalDir)) {
      const seen = new Set(skills.map((s) => s.name));
      for (const entry of readdirSync(globalDir)) {
        const skillDir = join(globalDir, entry);
        try {
          const summary = loader.toSummary(skillDir, 'global');
          if (!seen.has(summary.name)) {
            skills.push(summary);
            seen.add(summary.name);
          }
        } catch { /* skip */ }
      }
    }
  }

  if (options.json) {
    logger.plain(JSON.stringify(skills, null, 2));
    return;
  }

  if (skills.length === 0) {
    logger.warn('No skills installed.');
    logger.hint("Run 'agentic-skill add tdd-pipeline' to install your first skill.");
    logger.hint("Run 'agentic-skill search' to browse the registry.");
    return;
  }

  logger.section(`Installed Skills (${skills.length})`);
  logger.row(
    ['NAME', 'VERSION', 'SCOPE', 'DESCRIPTION'],
    [28, 10, 10, 40]
  );
  logger.divider();

  for (const s of skills) {
    const scopeColor = s.scope === 'local' ? `\x1b[33m${s.scope}\x1b[0m` : `\x1b[90m${s.scope}\x1b[0m`;
    logger.row(
      [s.name, s.version, s.scope, s.description.slice(0, 50)],
      [28, 10, 10, 50]
    );
  }

  logger.divider();
  logger.hint("Run 'agentic-skill session start' to inject skills into your IDE");
}
