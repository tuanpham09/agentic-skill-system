import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { existsSync, mkdirSync, dirname } from 'fs';
import * as schema from './schema.js';

const DB_PATH = process.env['DATABASE_URL']?.replace('file:', '') ?? './registry.db';

function getDb(): ReturnType<typeof drizzle> {
  const dir = dirname(DB_PATH);
  if (dir && dir !== '.' && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const sqlite = new Database(DB_PATH);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  return drizzle(sqlite, { schema });
}

export const db = getDb();
export type DB = typeof db;
