import { writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import type { IIDEAdapter } from '../base.js';
import { buildContextMarkdown } from '../base.js';
import type { AgentContext } from '@agentic-skill/core';

export class OpenCodeAdapter implements IIDEAdapter {
  readonly ideName = 'opencode';
  readonly contextFilePath = '.opencode/context.md';

  isDetected(projectRoot: string): boolean {
    return (
      existsSync(join(projectRoot, '.opencode')) ||
      existsSync(join(projectRoot, 'opencode.json'))
    );
  }

  async injectContext(context: AgentContext, projectRoot: string): Promise<void> {
    const dir = join(projectRoot, '.opencode');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const content = buildContextMarkdown(context);
    writeFileSync(join(projectRoot, this.contextFilePath), content, 'utf-8');
  }

  async clearContext(projectRoot: string): Promise<void> {
    const path = join(projectRoot, this.contextFilePath);
    if (existsSync(path)) {
      // Write empty rather than delete — preserves the file so IDE doesn't error
      writeFileSync(path, '<!-- Session ended. Run `agentic-skill session start` to resume. -->\n', 'utf-8');
    }
  }
}
