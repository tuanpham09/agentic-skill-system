import type { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { db } from '../db/connection.js';
import { tokens, users } from '../db/schema.js';
import { eq, and, gt } from 'drizzle-orm';

export interface AuthedRequest extends Request {
  userId?: string;
  username?: string;
}

export function authMiddleware(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header required', code: 'AUTH_REQUIRED' });
    return;
  }

  const rawToken = authHeader.slice(7);
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const now = new Date().toISOString();

  const row = db
    .select({ userId: tokens.userId, username: users.username })
    .from(tokens)
    .innerJoin(users, eq(users.id, tokens.userId))
    .where(and(eq(tokens.tokenHash, tokenHash), gt(tokens.expiresAt, now)))
    .get();

  if (!row) {
    res.status(401).json({ error: 'Invalid or expired token', code: 'AUTH_FAILED' });
    return;
  }

  req.userId = row.userId;
  req.username = row.username;
  next();
}
