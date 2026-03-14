import { OpenCodeAdapter } from './opencode/index.js';
import { ClaudeAdapter } from './claude/index.js';
import { CopilotAdapter } from './copilot/index.js';
import { CodexAdapter } from './codex/index.js';
import { CursorAdapter } from './cursor/index.js';
import { WindsurfAdapter } from './windsurf/index.js';
import type { IIDEAdapter } from './base.js';

export type { IIDEAdapter };
export { OpenCodeAdapter } from './opencode/index.js';
export { ClaudeAdapter } from './claude/index.js';
export { CopilotAdapter } from './copilot/index.js';
export { CodexAdapter } from './codex/index.js';
export { CursorAdapter } from './cursor/index.js';
export { WindsurfAdapter } from './windsurf/index.js';
export { buildContextMarkdown } from './base.js';

// Priority order for auto-detection
const ALL_ADAPTERS: IIDEAdapter[] = [
  new OpenCodeAdapter(),
  new CursorAdapter(),
  new WindsurfAdapter(),
  new ClaudeAdapter(),
  new CopilotAdapter(),
  new CodexAdapter(),
];

const ADAPTER_MAP: Record<string, IIDEAdapter> = {
  opencode: new OpenCodeAdapter(),
  claude: new ClaudeAdapter(),
  copilot: new CopilotAdapter(),
  codex: new CodexAdapter(),
  cursor: new CursorAdapter(),
  windsurf: new WindsurfAdapter(),
};

export function getAdapter(ideName: string): IIDEAdapter {
  const adapter = ADAPTER_MAP[ideName];
  if (!adapter) {
    const valid = Object.keys(ADAPTER_MAP).join(', ');
    throw new Error(`Unknown IDE adapter: '${ideName}'\n→ Valid options: ${valid}`);
  }
  return adapter;
}

export function detectAdapter(projectRoot: string): IIDEAdapter | null {
  return ALL_ADAPTERS.find((a) => a.isDetected(projectRoot)) ?? null;
}

export function resolveAdapter(ideConfig: string, projectRoot: string): IIDEAdapter | null {
  if (ideConfig !== 'auto') return getAdapter(ideConfig);
  return detectAdapter(projectRoot);
}
