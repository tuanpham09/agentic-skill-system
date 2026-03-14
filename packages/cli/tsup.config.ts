import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  platform: 'node',
  target: 'node20',
  bundle: true,
  splitting: false,
  noExternal: [
    /@agentic-skill\/.*/,
    'commander',
    'chalk',
    '@inquirer/prompts',
    'gray-matter',
    'zod',
  ],
  external: ['fs', 'path', 'os', 'crypto', 'child_process', 'stream', 'url', 'util'],
});