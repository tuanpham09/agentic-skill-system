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
  external: ['fs', 'path', 'os', 'crypto', 'child_process', 'stream', 'url', 'util'],
  noExternal: [/@agentic-skill\/.*/],
});