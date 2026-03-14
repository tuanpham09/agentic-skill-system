import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { IIDEAdapter } from '../base.js';
import { buildContextMarkdown } from '../base.js';
import type { AgentContext } from '@agentic-skill/core';

const SESSION_BLOCK_START = '<!-- AGENTIC-SKILL:SESSION:START -->';
const SESSION_BLOCK_END = '<!-- AGENTIC-SKILL:SESSION:END -->';

export class ClaudeAdapter implements IIDEAdapter {
  readonly ideName = 'claude';
  readonly contextFilePath = 'CLAUDE.md';

  isDetected(projectRoot: string): boolean {
    return existsSync(join(projectRoot, 'CLAUDE.md'));
  }

  async injectContext(context: AgentContext, projectRoot: string): Promise<void> {
    const filePath = join(projectRoot, this.contextFilePath);
    const sessionBlock = `${SESSION_BLOCK_START}\n${buildContextMarkdown(context)}\n${SESSION_BLOCK_END}`;

    if (!existsSync(filePath)) {
      // Create CLAUDE.md with session block only
      writeFileSync(filePath, sessionBlock + '\n', 'utf-8');
      return;
    }

    let existing = readFileSync(filePath, 'utf-8');

    if (existing.includes(SESSION_BLOCK_START)) {
      // Replace existing session block
      const startIdx = existing.indexOf(SESSION_BLOCK_START);
      const endIdx = existing.indexOf(SESSION_BLOCK_END);
      if (endIdx !== -1) {
        existing =
          existing.slice(0, startIdx).trimEnd() +
          '\n\n' +
          sessionBlock +
          '\n' +
          existing.slice(endIdx + SESSION_BLOCK_END.length).trimStart();
      }
    } else {
      // Append session block at the end
      existing = existing.trimEnd() + '\n\n' + sessionBlock + '\n';
    }

    writeFileSync(filePath, existing, 'utf-8');
  }

  async clearContext(projectRoot: string): Promise<void> {
    const filePath = join(projectRoot, this.contextFilePath);
    if (!existsSync(filePath)) return;

    let content = readFileSync(filePath, 'utf-8');
    if (!content.includes(SESSION_BLOCK_START)) return;

    const startIdx = content.indexOf(SESSION_BLOCK_START);
    const endIdx = content.indexOf(SESSION_BLOCK_END);
    if (endIdx === -1) return;

    content =
      content.slice(0, startIdx).trimEnd() +
      '\n' +
      content.slice(endIdx + SESSION_BLOCK_END.length).trimStart();

    writeFileSync(filePath, content.trim() + '\n', 'utf-8');
  }
}
