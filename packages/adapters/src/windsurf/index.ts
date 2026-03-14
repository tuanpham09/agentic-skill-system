import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { IIDEAdapter } from '../base.js';
import { buildContextMarkdown } from '../base.js';
import type { AgentContext } from '@agentic-skill/core';

export class WindsurfAdapter implements IIDEAdapter {
  readonly ideName = 'windsurf';
  // Windsurf reads from .windsurfrules
  readonly contextFilePath = '.windsurfrules';

  isDetected(projectRoot: string): boolean {
    return (
      existsSync(join(projectRoot, '.windsurfrules')) ||
      existsSync(join(projectRoot, '.windsurf'))
    );
  }

  async injectContext(context: AgentContext, projectRoot: string): Promise<void> {
    const content = buildContextMarkdown(context);
    writeFileSync(join(projectRoot, this.contextFilePath), content, 'utf-8');
  }

  async clearContext(projectRoot: string): Promise<void> {
    const path = join(projectRoot, this.contextFilePath);
    if (existsSync(path)) {
      writeFileSync(path, '<!-- Session ended. Run `agentic-skill session start` to resume. -->\n', 'utf-8');
    }
  }
}
