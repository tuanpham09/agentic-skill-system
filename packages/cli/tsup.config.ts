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
  banner: {
    js: '#!/usr/bin/env node',
  },
  async onSuccess() {
    // Copy bundled skills into dist so they're available after npm install
    const skillsSrc = join(__dirname, '..', '..', 'skills');
    const skillsDest = join(__dirname, 'dist', '..', 'skills');
    copyDir(skillsSrc, skillsDest);
    process.stdout.write(`✓ Copied skills/ → package\n`);
  },
});
