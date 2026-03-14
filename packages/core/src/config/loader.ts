import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { agenticConfigSchema, type AgenticConfig } from './schema.js';

export const GLOBAL_SKILLS_DIR = join(homedir(), '.agentic-skills');
export const GLOBAL_CONFIG_PATH = join(GLOBAL_SKILLS_DIR, 'config.json');
export const LOCAL_CONFIG_FILENAME = '.agentic.json';

export class ConfigLoader {
  load(projectRoot: string): AgenticConfig {
    const globalRaw = this.readJson(GLOBAL_CONFIG_PATH);
    const localRaw = this.readJson(join(projectRoot, LOCAL_CONFIG_FILENAME));

    // Local overrides global; schema fills in defaults
    const merged = { ...globalRaw, ...localRaw };

    // Deep merge state object
    if (globalRaw['state'] && localRaw['state']) {
      merged['state'] = { ...globalRaw['state'] as object, ...localRaw['state'] as object };
    }

    const result = agenticConfigSchema.safeParse(merged);

    if (!result.success) {
      const errors = result.error.issues
        .map((i) => `  ${i.path.join('.')}: ${i.message}`)
        .join('\n');
      throw new Error(`Invalid .agentic.json:\n${errors}`);
    }

    return result.data;
  }

  write(projectRoot: string, config: Partial<AgenticConfig>): void {
    const path = join(projectRoot, LOCAL_CONFIG_FILENAME);
    const existing = existsSync(path) ? this.readJson(path) : {};
    const merged = { ...existing, ...config };
    writeFileSync(path, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
  }

  writeGlobal(data: Record<string, unknown>): void {
    const dir = dirname(GLOBAL_CONFIG_PATH);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const existing = existsSync(GLOBAL_CONFIG_PATH) ? this.readJson(GLOBAL_CONFIG_PATH) : {};
    const merged = { ...existing, ...data };
    writeFileSync(GLOBAL_CONFIG_PATH, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
  }

  readGlobal(): Record<string, unknown> {
    return this.readJson(GLOBAL_CONFIG_PATH);
  }

  exists(projectRoot: string): boolean {
    return existsSync(join(projectRoot, LOCAL_CONFIG_FILENAME));
  }

  private readJson(path: string): Record<string, unknown> {
    if (!existsSync(path)) return {};
    try {
      return JSON.parse(readFileSync(path, 'utf-8')) as Record<string, unknown>;
    } catch {
      throw new Error(`Failed to parse JSON at ${path}. Check for syntax errors.`);
    }
  }
}
