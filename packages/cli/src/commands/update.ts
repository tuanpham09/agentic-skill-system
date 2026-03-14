import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { RegistryClient, SkillLoader, SkillCache, SkillInstaller } from '@agentic-skill/core';
import type { AppContext } from '@agentic-skill/core';
import { logger } from '../utils/logger.js';

interface UpdateOptions {
  check?: boolean;
}

export async function updateCommand(
  skillName: string | undefined,
  options: UpdateOptions,
  ctx: AppContext
): Promise<void> {
  const globalDir = join(homedir(), '.agentic-skills', 'skills');
  const loader = new SkillLoader();

  // Collect installed skills
  const installed: Array<{ name: string; version: string; path: string }> = [];

  if (existsSync(globalDir)) {
    for (const entry of readdirSync(globalDir)) {
      try {
        const skillPath = join(globalDir, entry);
        const meta = loader.loadMeta(skillPath);
        if (!skillName || meta.name === skillName) {
          installed.push({ name: meta.name, version: meta.version, path: skillPath });
        }
      } catch { /* skip invalid */ }
    }
  }

  if (installed.length === 0) {
    if (skillName) {
      logger.error(`Skill '${skillName}' is not installed globally.`);
    } else {
      logger.warn('No globally installed skills to update.');
    }
    logger.hint("Run 'agentic-skill list' to see installed skills.");
    return;
  }

  const client = new RegistryClient(ctx.config.registry);
  const updates: Array<{ name: string; current: string; latest: string }> = [];

  logger.info(`Checking ${installed.length} skill(s) for updates...`);

  for (const skill of installed) {
    try {
      const resolved = await client.resolve(skill.name, 'latest');
      if (resolved.version !== skill.version) {
        updates.push({ name: skill.name, current: skill.version, latest: resolved.version });
      }
    } catch {
      // Registry unreachable or skill not in registry — skip silently
    }
  }

  if (updates.length === 0) {
    logger.success('All skills are up to date.');
    return;
  }

  logger.section(`Updates Available (${updates.length})`);
  for (const u of updates) {
    logger.plain(`  ${u.name.padEnd(30)} ${u.current} → ${u.latest}`);
  }

  if (options.check) {
    logger.newline();
    logger.hint("Run 'agentic-skill update' to install all updates.");
    return;
  }

  // Install updates
  logger.newline();
  const cache = new SkillCache();
  const installer = new SkillInstaller();
  let updated = 0;

  for (const u of updates) {
    try {
      logger.info(`Updating ${u.name}: ${u.current} → ${u.latest}...`);
      const resolved = await client.resolve(u.name, 'latest');

      const cachePath = join(homedir(), '.agentic-skills', 'skills', `${u.name}@${u.latest}`);
      await client.download(resolved.downloadUrl, cachePath);
      cache.register(u.name, u.latest, cachePath, resolved.integrity);

      installer.installFromPath(cachePath, ctx.projectRoot, { local: false });
      logger.success(`Updated ${u.name} to ${u.latest}`);
      updated++;
    } catch (err) {
      logger.warn(`Failed to update ${u.name}: ${(err as Error).message}`);
    }
  }

  logger.newline();
  logger.success(`Updated ${updated} of ${updates.length} skill(s).`);
  logger.hint("Run 'agentic-skill session start' to inject updated skills into your IDE.");
}
