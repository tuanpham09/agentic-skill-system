import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { input, select } from '@inquirer/prompts';
import type { AppContext } from '@agentic-skill/core';
import { NotesManager } from '@agentic-skill/core';
import { logger } from '../utils/logger.js';

interface ProposeOptions {
  priority?: string;
}

export async function proposeCommand(
  featureName: string | undefined,
  options: ProposeOptions,
  ctx: AppContext
): Promise<void> {
  const openspecDir = join(ctx.projectRoot, '.agentic', 'openspec', 'changes');

  if (!existsSync(join(ctx.projectRoot, '.agentic'))) {
    logger.error('Not initialized. Run: agentic-skill init');
    process.exit(1);
  }

  mkdirSync(openspecDir, { recursive: true });

  const title = featureName ?? await input({ message: 'Feature name:' });
  const priority = options.priority ?? await select({
    message: 'Priority:',
    choices: [
      { name: 'High — blocks other work', value: 'high' },
      { name: 'Medium — next sprint', value: 'medium' },
      { name: 'Low — backlog', value: 'low' },
    ],
    default: 'medium',
  });

  const problem = await input({ message: 'What problem does this solve? (brief):', default: '' });
  const solution = await input({ message: 'Proposed solution (brief):', default: '' });

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const filename = `${slug}.md`;
  const filePath = join(openspecDir, filename);

  const content = `---
title: "${title}"
status: proposal
proposedBy: developer
createdAt: ${new Date().toISOString().slice(0, 10)}
priority: ${priority}
---

## Problem

${problem || '(to be filled — describe the user pain or technical need)'}

## Proposed solution

${solution || '(to be filled — describe what should be built)'}

## Acceptance criteria

- [ ] (agent will fill these during planning)

## Out of scope

(explicitly list what is NOT included)

## Effort estimate

Small / Medium / Large

## Implementation notes

(agent will add technical notes here during design)
`;

  writeFileSync(filePath, content, 'utf-8');
  logger.success(`Proposal created: .agentic/openspec/changes/${filename}`);
  logger.newline();
  logger.hint('Next: chat with your agent about this proposal.');
  logger.hint('It will read the file and help fill in acceptance criteria and tasks.');
  logger.hint(`Then add to kanban: agentic-skill task add "${title}" --feature "${slug}"`);

  // Log to notes
  const notes = new NotesManager(ctx.projectRoot);
  notes.append(`Feature proposal created: ${title} (${priority} priority)`);
}
