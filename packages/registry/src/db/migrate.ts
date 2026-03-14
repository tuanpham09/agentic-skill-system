import Database from 'better-sqlite3';
import { existsSync, mkdirSync, dirname } from 'fs';

const DB_PATH = process.env['DATABASE_URL']?.replace('file:', '') ?? './registry.db';

const dir = dirname(DB_PATH);
if (dir && dir !== '.' && !existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    author_id TEXT NOT NULL REFERENCES users(id),
    latest_version TEXT NOT NULL,
    description TEXT NOT NULL,
    keywords TEXT NOT NULL,
    downloads INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS skills_name_idx ON skills(name);

  CREATE TABLE IF NOT EXISTS skill_versions (
    id TEXT PRIMARY KEY,
    skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    bundle_url TEXT NOT NULL,
    integrity TEXT NOT NULL,
    meta TEXT NOT NULL,
    published_at TEXT NOT NULL,
    UNIQUE(skill_id, version)
  );

  CREATE TABLE IF NOT EXISTS tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

process.stdout.write('✓ Database migrated\n');
db.close();
