import { existsSync } from 'fs';
import { join, isAbsolute, resolve } from 'path';
import { homedir } from 'os';
import {
  SkillInstaller,
  SkillCache,
  RegistryClient,
  NotFoundError,
  ConfigLoader,
} from '@agentic-skill/core';
import type { AppContext } from '@agentic-skill/core';
import { logger } from '../utils/logger.js';
import { getBundledSkillsDir } from '../utils/context.js';

interface AddOptions {
  local?: boolean;
  version?: string;
  dev?: boolean;
}

export async function addCommand(
  skillName: string,
  options: AddOptions,
  ctx: AppContext
): Promise<void> {
  if (!skillName) {
    logger.error('Skill name required.');
    logger.hint('Usage: agentic-skill add <skill-name>');
    logger.hint('       agentic-skill add ./my-local-skill --local');
    process.exit(1);
  }

  // --- Guard: must be in an initialized project ---
  const configLoader = new ConfigLoader();
  if (!configLoader.exists(ctx.projectRoot)) {
    logger.error('Not in an agentic-skill project.');
    logger.hint("Run 'agentic-skill init' first.");
    process.exit(1);
  }

  const installer = new SkillInstaller();

  // --- Local path install (starts with . or / or ~) ---
  if (skillName.startsWith('.') || isAbsolute(skillName)) {
    const skillDir = resolve(ctx.projectRoot, skillName);
    if (!existsSync(skillDir)) {
      logger.error(`Path not found: ${skillDir}`);
      process.exit(1);
    }
    try {
      const result = installer.installFromPath(skillDir, ctx.projectRoot, options);
      logger.success(`Installed ${result.name}@${result.version} [${result.scope}]`);
      logger.hint(`Run 'agentic-skill session start' to inject into your IDE`);
    } catch (err) {
      logger.error((err as Error).message);
      process.exit(1);
    }
    return;
  }

  // --- Bundled skill install (offline-first) ---
  const bundledDir = getBundledSkillsDir();
  const bundledPath = join(bundledDir, skillName);

  if (process.env['AGENTIC_OFFLINE'] === 'true') {
    if (!existsSync(bundledPath)) {
      logger.error(`Skill '${skillName}' not found in bundled skills.`);
      logger.hint('Offline mode is active. Remove AGENTIC_OFFLINE=true to fetch from registry.');
      process.exit(1);
    }
    logger.info(`Offline mode: using bundled ${skillName}`);
    return installFromDir(bundledPath, skillName, installer, ctx, options);
  }

  // --- Check cache first ---
  const cache = new SkillCache();
  const version = options.version ?? 'latest';

  if (version !== 'latest') {
    const cached = cache.getPath(skillName, version);
    if (cached) {
      logger.info(`(cached) ${skillName}@${version}`);
      return installFromDir(cached, skillName, installer, ctx, options);
    }
  } else {
    const cached = cache.getLatest(skillName);
    if (cached) {
      logger.info(`(cached) Using ${skillName}@${cached.version}`);
      return installFromDir(cached.path, skillName, installer, ctx, options);
    }
  }

  // --- Fetch from registry ---
  const registryClient = new RegistryClient(ctx.config.registry);

  try {
    logger.info(`Fetching ${skillName}@${version} from registry...`);
    const resolved = await registryClient.resolve(skillName, version);

    // Download to cache
    const cachePath = join(
      homedir(),
      '.agentic-skills',
      'skills',
      `${resolved.name}@${resolved.version}`
    );

    await registryClient.download(resolved.downloadUrl, cachePath);
    cache.register(resolved.name, resolved.version, cachePath, resolved.integrity);

    return installFromDir(cachePath, skillName, installer, ctx, options);
  } catch (err) {
    if (err instanceof NotFoundError) {
      // Fall back to bundled
      if (existsSync(bundledPath)) {
        logger.warn(`Not found in registry — using bundled version.`);
        return installFromDir(bundledPath, skillName, installer, ctx, options);
      }
      logger.error(err.message);
      process.exit(1);
    }
    // Network error — try bundled fallback
    if (existsSync(bundledPath)) {
      logger.warn(`Registry unreachable — using bundled version.`);
      return installFromDir(bundledPath, skillName, installer, ctx, options);
    }
    logger.error(`Failed to install ${skillName}: ${(err as Error).message}`);
    process.exit(1);
  }
}

function installFromDir(
  skillDir: string,
  skillName: string,
  installer: SkillInstaller,
  ctx: AppContext,
  options: AddOptions
): void {
  try {
    const result = installer.installFromPath(skillDir, ctx.projectRoot, options);
    const scopeLabel = options.local ? '[local → .skills/]' : '[global → ~/.agentic-skills/]';
    logger.success(`Installed ${result.name}@${result.version} ${scopeLabel}`);
    logger.hint(`Run 'agentic-skill session start' to inject it into your IDE`);
  } catch (err) {
    logger.error(`Validation failed for '${skillName}':`);
    logger.plain((err as Error).message);
    process.exit(1);
  }
}
