import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { IIDEAdapter } from '../base.js';
import { buildContextMarkdown } from '../base.js';
import type { AgentContext } from '@agentic-skill/core';

export class CopilotAdapter implements IIDEAdapter {
  readonly ideName = 'copilot';
  readonly contextFilePath = '.github/copilot-instructions.md';

  isDetected(projectRoot: string): boolean {
    return existsSync(join(projectRoot, '.github', 'copilot-instructions.md'));
  }

  async injectContext(context: AgentContext, projectRoot: string): Promise<void> {
    const dir = join(projectRoot, '.github');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

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
