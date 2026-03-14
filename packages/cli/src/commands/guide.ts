import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { AppContext } from '@agentic-skill/core';
import { logger } from '../utils/logger.js';

const GUIDES: Record<string, string> = {
  opencode: `# Using agentic-skill with OpenCode

## Setup
After \`agentic-skill init --ide opencode\`, context is written to:
  .opencode/context.md

OpenCode reads this automatically at session start.

## Workflow
\`\`\`bash
# Start session (injects context)
agentic-skill session start

# Open OpenCode — it will read .opencode/context.md
open .  # or code .

# Work with the agent — it already knows:
# - Current task from SESSION_STATE.md
# - All installed skills from .agentic/AGENT_QUICK_REF.md
# - Project conventions from .agentic/docs/CONVENTIONS.md
\`\`\`

## OpenCode-specific tips
- In OpenCode chat: "Read AGENT_QUICK_REF.md and tell me what to do next"
- OpenCode respects .opencode/context.md as system context
- After session: agentic-skill session end
`,

  cursor: `# Using agentic-skill with Cursor

## Setup
After \`agentic-skill init --ide cursor\`, context is written to:
  .cursorrules           (legacy, all Cursor versions)
  .cursor/rules/agentic-context.mdc  (Cursor 0.43+, preferred)

Cursor reads these files automatically for every AI interaction.

## Workflow
\`\`\`bash
# Start session (updates .cursorrules + .cursor/rules/)
agentic-skill session start

# Open Cursor
cursor .

# In Cursor chat:
# "What's the current task?" — reads SESSION_STATE.md
# "Show me the kanban board" — run: agentic-skill board
# "What conventions do we use?" — reads CONVENTIONS.md
\`\`\`

## Cursor-specific tips
- Use Cursor's @-mention: @.agentic/AGENT_QUICK_REF.md
- Cmd+K with context: Cursor will use .cursorrules automatically
- Cursor Composer: it reads .cursor/rules/ for multi-file edits
- Set alwaysApply: true in .cursor/rules/agentic-context.mdc (already done)
`,

  windsurf: `# Using agentic-skill with Windsurf

## Setup
After \`agentic-skill init --ide windsurf\`, context is written to:
  .windsurfrules

Windsurf (Codeium) reads .windsurfrules automatically.

## Workflow
\`\`\`bash
# Start session
agentic-skill session start

# Open Windsurf
windsurf .

# Cascade AI will read .windsurfrules on each interaction
\`\`\`

## Windsurf-specific tips
- Windsurf Cascade reads .windsurfrules as persistent context
- Use "memories" feature alongside agentic-skill for best results
- After major changes: agentic-skill session start (refresh context)
`,

  claude: `# Using agentic-skill with Claude Code

## Setup
After \`agentic-skill init --ide claude\`, context is written to:
  CLAUDE.md  (session block injected between HTML comments)

Claude Code reads CLAUDE.md automatically on startup.

## Workflow
\`\`\`bash
# Start session (updates CLAUDE.md session block)
agentic-skill session start

# Start Claude Code
claude

# Claude will read CLAUDE.md — it already knows:
# - Current sprint task
# - Project rules and conventions
# - Installed skills and when to use them
\`\`\`

## Claude Code-specific tips
- Claude reads CLAUDE.md at the start of every conversation
- Sub-agents also inherit CLAUDE.md context
- Keep CLAUDE.md under ~2000 tokens for best results
- Use: claude --dangerously-skip-permissions for automated tasks
`,

  copilot: `# Using agentic-skill with GitHub Copilot

## Setup
After \`agentic-skill init --ide copilot\`, context is written to:
  .github/copilot-instructions.md

Copilot reads this for repository-level instructions.

## Workflow
\`\`\`bash
# Start session
agentic-skill session start

# VS Code with Copilot Chat will use .github/copilot-instructions.md
# for context in every chat interaction
\`\`\`

## Copilot-specific tips
- Copilot Chat: "@workspace What's my current task?"
- Works in VS Code, JetBrains, and Copilot CLI
- Refresh context: agentic-skill session start (re-run after task changes)
- Also add #.agentic/docs/CONVENTIONS.md to Copilot context manually
`,

  codex: `# Using agentic-skill with Codex CLI

## Setup
After \`agentic-skill init --ide codex\`, context is written to:
  AGENTS.md

Codex CLI reads AGENTS.md as agent instructions.

## Workflow
\`\`\`bash
# Start session
agentic-skill session start

# Run Codex with full context
codex "What's the next task I should work on?"
# Codex reads AGENTS.md and SESSION_STATE.md

# For autonomous task execution:
codex --full-auto "Implement the task in SESSION_STATE.md"
\`\`\`

## Codex-specific tips
- Use AGENTS.md to define agent persona and workflow
- Codex respects AGENTS.md for multi-step autonomous tasks
- For complex tasks: let agent read .agentic/docs/SPRINT_CURRENT.md
`,
};

export function guideCommand(ideName: string | undefined, ctx: AppContext): void {
  const ide = ideName ?? ctx.config.ide ?? 'opencode';

  if (ide === 'list') {
    logger.section('Available IDE guides');
    for (const name of Object.keys(GUIDES)) {
      logger.plain(`  agentic-skill guide ${name}`);
    }
    return;
  }

  const guide = GUIDES[ide];
  if (!guide) {
    logger.error(`No guide for IDE: '${ide}'`);
    logger.hint(`Available: ${Object.keys(GUIDES).join(', ')}`);
    logger.hint("Or: agentic-skill guide list");
    process.exit(1);
  }

  // Save to .agentic/guides/
  const guidesDir = join(ctx.projectRoot, '.agentic', 'guides');
  if (existsSync(join(ctx.projectRoot, '.agentic'))) {
    mkdirSync(guidesDir, { recursive: true });
    writeFileSync(join(guidesDir, `${ide}.md`), guide, 'utf-8');
  }

  // Print to terminal
  logger.newline();
  guide.split('\n').forEach((line) => logger.plain(line));
}
