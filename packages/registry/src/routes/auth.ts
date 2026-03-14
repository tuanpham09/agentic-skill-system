import { Router } from 'express';
import { createHash, randomBytes } from 'crypto';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { users, tokens } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-z0-9_-]+$/),
  password: z.string().min(8),
});

// POST /api/v1/auth/token — get an API token
authRouter.post('/token', (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'username and password required', code: 'VALIDATION_FAILED' });
    return;
  }

  const { username, password } = result.data;
  const passwordHash = createHash('sha256').update(password).digest('hex');

  const user = db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .get();

  if (!user || user.passwordHash !== passwordHash) {
    res.status(401).json({ error: 'Invalid credentials', code: 'AUTH_FAILED' });
    return;
  }

  // Generate token
  const rawToken = `agt_${randomBytes(32).toString('hex')}`;
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year

  db.insert(tokens).values({
    id: randomUUID(),
    userId: user.id,
    tokenHash,
    expiresAt,
    createdAt: new Date().toISOString(),
  }).run();

  res.json({ token: rawToken, expiresAt });
});

// POST /api/v1/auth/register — create account (open for now)
authRouter.post('/register', (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      error: result.error.issues.map((i) => i.message).join(', '),
      code: 'VALIDATION_FAILED',
    });
    return;
  }

  const { username, password } = result.data;

  // Check if username already exists
  const existing = db.select().from(users).where(eq(users.username, username)).get();
  if (existing) {
    res.status(409).json({ error: 'Username already taken', code: 'USERNAME_EXISTS' });
    return;
  }

  const passwordHash = createHash('sha256').update(password).digest('hex');

  db.insert(users).values({
    id: randomUUID(),
    username,
    passwordHash,
    createdAt: new Date().toISOString(),
  }).run();

  res.status(201).json({ username, message: 'Account created. Use /auth/token to get an API token.' });
});
