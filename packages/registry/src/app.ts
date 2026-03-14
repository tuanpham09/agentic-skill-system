import express, { type Request, type Response, type NextFunction } from 'express';
import { join, dirname } from 'path';
import { existsSync, createReadStream } from 'fs';
import { fileURLToPath } from 'url';
import { skillsRouter } from './routes/skills.js';
import { searchRouter } from './routes/search.js';
import { authRouter } from './routes/auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORAGE_PATH = process.env['STORAGE_PATH'] ?? join(__dirname, '..', 'bundles');

export function createApp(): express.Application {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS for browser-based registry browsing
  app.use((_req, res, next) => {
    const origin = process.env['ALLOWED_ORIGINS'] ?? '*';
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (_req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      version: process.env['npm_package_version'] ?? '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Serve skill bundles for download
  app.get('/bundles/:filename', (req, res) => {
    const { filename } = req.params as { filename: string };
    // Prevent path traversal
    if (filename.includes('..') || filename.includes('/')) {
      res.status(400).json({ error: 'Invalid filename', code: 'INVALID_REQUEST' });
      return;
    }
    const filePath = join(STORAGE_PATH, filename);
    if (!existsSync(filePath)) {
      res.status(404).json({ error: 'Bundle not found', code: 'NOT_FOUND' });
      return;
    }
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    createReadStream(filePath).pipe(res);
  });

  // API routes
  app.use('/api/v1/skills', skillsRouter);
  app.use('/api/v1/search', searchRouter);
  app.use('/api/v1/auth', authRouter);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
  });

  // Global error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    process.stderr.write(`[registry] Unhandled error: ${err.message}\n`);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  });

  return app;
}

// Start server when run directly
const PORT = parseInt(process.env['PORT'] ?? '3000', 10);
const app = createApp();

app.listen(PORT, () => {
  process.stdout.write(`✓ Registry server listening on http://localhost:${PORT}\n`);
  process.stdout.write(`  Health: http://localhost:${PORT}/health\n`);
});
