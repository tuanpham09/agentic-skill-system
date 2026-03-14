import {
  existsSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
  readFileSync,
} from 'fs';
import { join, homedir } from 'path';

const GLOBAL_SKILLS_DIR = join(homedir(), '.agentic-skills', 'skills');
const CACHE_INDEX_PATH = join(homedir(), '.agentic-skills', 'cache-index.json');

interface CacheEntry {
  name: string;
  version: string;
  path: string;
  cachedAt: string;
  integrity: string;
}

export class SkillCache {
  constructor(private skillsDir = GLOBAL_SKILLS_DIR) {
    mkdirSync(this.skillsDir, { recursive: true });
  }

  has(name: string, version: string): boolean {
    return existsSync(join(this.skillsDir, `${name}@${version}`, 'SKILL.md'));
  }

  getPath(name: string, version: string): string | null {
    const p = join(this.skillsDir, `${name}@${version}`);
    return existsSync(join(p, 'SKILL.md')) ? p : null;
  }

  /** Find the latest cached version for a skill */
  getLatest(name: string): { version: string; path: string } | null {
    if (!existsSync(this.skillsDir)) return null;
    const entries = readdirSync(this.skillsDir)
      .filter((d) => d.startsWith(`${name}@`))
      .sort()
      .reverse();
    if (entries.length === 0 || !entries[0]) return null;
    const version = entries[0].replace(`${name}@`, '');
    return { version, path: join(this.skillsDir, entries[0]) };
  }

  register(name: string, version: string, path: string, integrity: string): void {
    const index = this.readIndex();
    const key = `${name}@${version}`;
    index[key] = {
      name,
      version,
      path,
      cachedAt: new Date().toISOString(),
      integrity,
    };
    this.writeIndex(index);
  }

  private readIndex(): Record<string, CacheEntry> {
    if (!existsSync(CACHE_INDEX_PATH)) return {};
    try {
      return JSON.parse(readFileSync(CACHE_INDEX_PATH, 'utf-8')) as Record<string, CacheEntry>;
    } catch {
      return {};
    }
  }

  private writeIndex(index: Record<string, CacheEntry>): void {
    mkdirSync(join(homedir(), '.agentic-skills'), { recursive: true });
    writeFileSync(CACHE_INDEX_PATH, JSON.stringify(index, null, 2) + '\n', 'utf-8');
  }
}
