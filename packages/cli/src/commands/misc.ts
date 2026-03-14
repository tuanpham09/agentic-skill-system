import { RegistryClient, ConfigLoader, NotesManager } from '@agentic-skill/core';
import type { AppContext } from '@agentic-skill/core';
import { logger } from '../utils/logger.js';

// ─── SEARCH ─────────────────────────────────────────────────────────────────

interface SearchOptions { limit?: number }

export async function searchCommand(
  query: string,
  options: SearchOptions,
  ctx: AppContext
): Promise<void> {
  if (!query) {
    logger.error('Search query required.');
    logger.hint('Usage: agentic-skill search <query>');
    process.exit(1);
  }

  logger.info(`Searching registry for "${query}"...`);
  const client = new RegistryClient(ctx.config.registry);

  try {
    const results = await client.search(query, options.limit ?? 10);

    if (results.length === 0) {
      logger.plain(`No skills found for "${query}".`);
      logger.hint('Try a broader term or browse: https://registry.agentic-skill.dev');
      return;
    }

    logger.section(`Results for "${query}" (${results.length})`);
    logger.row(['NAME', 'VERSION', 'DOWNLOADS', 'DESCRIPTION'], [28, 10, 12, 40]);
    logger.divider();

    for (const r of results) {
      logger.row(
        [r.name, r.version, String(r.downloads), r.description.slice(0, 50)],
        [28, 10, 12, 50]
      );
    }

    logger.divider();
    logger.hint(`Install: agentic-skill add <skill-name>`);
  } catch (err) {
    logger.error(`Search failed: ${(err as Error).message}`);
    logger.hint('Check your internet connection or try: agentic-skill list');
    process.exit(1);
  }
}

// ─── PUBLISH ─────────────────────────────────────────────────────────────────

interface PublishOptions { dryRun?: boolean; tag?: string }

export async function publishCommand(
  skillPath: string,
  options: PublishOptions,
  ctx: AppContext
): Promise<void> {
  const { resolve } = await import('path');
  const { existsSync } = await import('fs');
  const { SkillValidator } = await import('@agentic-skill/core');
  const { createZipBundle } = await import('../utils/bundle.js');

  const absPath = resolve(ctx.projectRoot, skillPath);
  if (!existsSync(absPath)) {
    logger.error(`Path not found: ${absPath}`);
    process.exit(1);
  }

  // Validate
  logger.info('Validating skill...');
  const validator = new SkillValidator();
  const result = validator.validate(absPath);

  if (!result.valid) {
    logger.error('Validation failed:');
    result.errors.forEach((e) => logger.plain(`  • ${e}`));
    process.exit(1);
  }
  logger.success('Skill is valid');

  if (options.dryRun) {
    logger.info('Dry run — not publishing.');
    logger.hint('Remove --dry-run to publish.');
    return;
  }

  // Check auth
  const configLoader = new ConfigLoader();
  const globalConfig = configLoader.readGlobal();
  const auth = globalConfig['auth'] as { token?: string; registry?: string } | undefined;

  if (!auth?.token) {
    logger.error('Not authenticated.');
    logger.hint('Run: agentic-skill login');
    process.exit(1);
  }

  // Bundle and publish
  logger.info('Bundling skill...');
  const zipPath = await createZipBundle(absPath);

  logger.info('Publishing to registry...');
  const client = new RegistryClient(ctx.config.registry, auth.token);

  try {
    const published = await client.publish(zipPath);
    logger.success(`Published ${published.name}@${published.version}`);
    logger.hint(`View: ${ctx.config.registry}/skills/${published.name}`);
  } catch (err) {
    logger.error(`Publish failed: ${(err as Error).message}`);
    process.exit(1);
  }
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

interface LoginOptions { token?: string; registry?: string }

export async function loginCommand(
  options: LoginOptions,
  ctx: AppContext
): Promise<void> {
  const configLoader = new ConfigLoader();
  const registry = options.registry ?? ctx.config.registry;

  if (options.token) {
    configLoader.writeGlobal({ auth: { token: options.token, registry } });
    logger.success('Token saved.');
    logger.plain(`  Registry: ${registry}`);
    return;
  }

  // Interactive login
  const { input, password } = await import('@inquirer/prompts');
  const username = await input({ message: 'Username:' });
  const pwd = await password({ message: 'Password:' });

  const client = new RegistryClient(registry);
  try {
    const { token } = await client.getToken(username, pwd);
    configLoader.writeGlobal({ auth: { token, registry } });
    logger.success(`Logged in as ${username}`);
  } catch (err) {
    logger.error((err as Error).message);
    process.exit(1);
  }
}

// ─── NOTES ───────────────────────────────────────────────────────────────────

export function notesAddCommand(content: string, ctx: AppContext): void {
  if (!content.trim()) {
    logger.error('Note content required.');
    logger.hint('Usage: agentic-skill notes add "Your decision or observation"');
    process.exit(1);
  }

  const mgr = new NotesManager(ctx.projectRoot, ctx.config.state.notesFile);
  const entry = mgr.append(content);
  logger.success(`Note added [${entry.timestamp}]`);
}

export function notesListCommand(ctx: AppContext): void {
  const mgr = new NotesManager(ctx.projectRoot, ctx.config.state.notesFile);
  const notes = mgr.list(20);

  if (notes.length === 0) {
    logger.plain('No notes yet.');
    logger.hint('Add one: agentic-skill notes add "Your decision"');
    return;
  }

  logger.section(`Notes (last ${notes.length})`);
  for (const n of notes) {
    logger.plain(`\n[${n.timestamp}]`);
    logger.plain(n.content);
  }
}
