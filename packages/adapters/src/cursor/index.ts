import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import type { IIDEAdapter } from '../base.js';
import { buildContextMarkdown } from '../base.js';
import type { AgentContext } from '@agentic-skill/core';

export class CursorAdapter implements IIDEAdapter {
  readonly ideName = 'cursor';
  // Cursor reads from .cursorrules (legacy) or .cursor/rules (new format)
  readonly contextFilePath = '.cursor/rules/agentic-context.mdc';

  isDetected(projectRoot: string): boolean {
    return (
      existsSync(join(projectRoot, '.cursor')) ||
      existsSync(join(projectRoot, '.cursorrules'))
    );
  }

  async injectContext(context: AgentContext, projectRoot: string): Promise<void> {
    // Write to new .cursor/rules/ format (Cursor 0.43+)
    const rulesDir = join(projectRoot, '.cursor', 'rules');
    if (!existsSync(rulesDir)) mkdirSync(rulesDir, { recursive: true });

    const mdcContent = this.buildMdcContent(context);
    writeFileSync(join(projectRoot, this.contextFilePath), mdcContent, 'utf-8');

    // Also write legacy .cursorrules for compatibility
    const legacyContent = buildContextMarkdown(context);
    writeFileSync(join(projectRoot, '.cursorrules'), legacyContent, 'utf-8');
  }

  async clearContext(projectRoot: string): Promise<void> {
    const mdcPath = join(projectRoot, this.contextFilePath);
    if (existsSync(mdcPath)) {
      writeFileSync(mdcPath, '<!-- Session ended. Run `agentic-skill session start` to resume. -->\n', 'utf-8');
    }
    const legacyPath = join(projectRoot, '.cursorrules');
    if (existsSync(legacyPath)) {
      writeFileSync(legacyPath, '<!-- Session ended. Run `agentic-skill session start` to resume. -->\n', 'utf-8');
    }
  }

  private buildMdcContent(ctx: AgentContext): string {
    // Cursor MDC format: YAML frontmatter + markdown body
    return `---
description: Agentic Skill System — project context (auto-generated)
alwaysApply: true
---

${buildContextMarkdown(ctx)}`;
  }
}
