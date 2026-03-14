import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';

function copyDir(src: string, dest: string): void {
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  platform: 'node',
  target: 'node20',
  external: ['fs', 'path', 'os', 'crypto', 'child_process', 'stream', 'url', 'util'],
  noExternal: [/@agentic-skill\/.*/],
  esbuildOptions(options) {
    options.banner = {
      js: '#!/usr/bin/env node',
    };
  },
  onSuccess: async () => {
    const { cpSync, existsSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const skillsSrc = join(__dirname, '..', '..', 'skills');
    const skillsDest = join(__dirname, 'skills');
    if (existsSync(skillsSrc)) {
      cpSync(skillsSrc, skillsDest, { recursive: true });
      process.stdout.write('✓ Skills copied\n');
    }
  },
});
