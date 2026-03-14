import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { IIDEAdapter } from '../base.js';
import { buildContextMarkdown } from '../base.js';
import type { AgentContext } from '@agentic-skill/core';

export class CodexAdapter implements IIDEAdapter {
  readonly ideName = 'codex';
  readonly contextFilePath = 'AGENTS.md';

  isDetected(projectRoot: string): boolean {
    return (
      existsSync(join(projectRoot, 'AGENTS.md')) ||
      !!process.env['CODEX_API_KEY'] ||
      !!process.env['OPENAI_API_KEY']
    );
  }

  async injectContext(context: AgentContext, projectRoot: string): Promise<void> {
    const content = buildContextMarkdown(context);
    writeFileSync(join(projectRoot, this.contextFilePath), content, 'utf-8');
  }

  async clearContext(projectRoot: string): Promise<void> {
    const path = join(projectRoot, this.contextFilePath);
    if (existsSync(path)) {
      writeFileSync(
        path,
        '<!-- Session ended. Run `agentic-skill session start` to resume. -->\n',
        'utf-8'
      );
    }
  }
}
