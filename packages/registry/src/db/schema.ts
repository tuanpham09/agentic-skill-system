import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull(),
});

export const skills = sqliteTable('skills', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  authorId: text('author_id')
    .notNull()
    .references(() => users.id),
  latestVersion: text('latest_version').notNull(),
  description: text('description').notNull(),
  keywords: text('keywords').notNull(),   // JSON array string
  downloads: integer('downloads').default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const skillVersions = sqliteTable('skill_versions', {
  id: text('id').primaryKey(),
  skillId: text('skill_id')
    .notNull()
    .references(() => skills.id, { onDelete: 'cascade' }),
  version: text('version').notNull(),
  bundleUrl: text('bundle_url').notNull(),
  integrity: text('integrity').notNull(),
  meta: text('meta').notNull(),            // full skill.json as JSON string
  publishedAt: text('published_at').notNull(),
});

export const tokens = sqliteTable('tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
});
