import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  SessionStateManager,
  NotesManager,
  ContextBuilder,
  SkillResolver,
  ConfigLoader,
  KanbanManager,
} from '@agentic-skill/core';
import { resolveAdapter } from '@agentic-skill/adapters';
import type { AppContext, AgentContext } from '@agentic-skill/core';
import { logger } from '../utils/logger.js';
import { getBundledSkillsDir } from '../utils/context.js';

interface SessionOptions {
  ide?: string;
}

export async function sessionStartCommand(
  options: SessionOptions,
  ctx: AppContext
): Promise<void> {
  const configLoader = new ConfigLoader();
  if (!configLoader.exists(ctx.projectRoot)) {
    logger.error('Not in an agentic-skill project.');
    logger.hint("Run 'agentic-skill init' first.");
    process.exit(1);
  }

  logger.info('Starting session...');

  // 1. Load session state
  const sessionMgr = new SessionStateManager(
    ctx.projectRoot,
    ctx.config.state.sessionFile
  );
  const state = sessionMgr.readOrDefault();
  logger.success(`Loaded ${ctx.config.state.sessionFile}`);

  // 2. Load notes
  const notesMgr = new NotesManager(ctx.projectRoot, ctx.config.state.notesFile);
  const recentNotes = notesMgr.getRecentText(5);
  const notesCount = notesMgr.list(100).length;
  logger.success(`Loaded ${ctx.config.state.notesFile} (${notesCount} entries)`);

  // 3. Load rules file
  const rulesPath = join(ctx.projectRoot, ctx.config.state.rulesFile);
  const rules = existsSync(rulesPath)
    ? readFileSync(rulesPath, 'utf-8')
    : '';
  if (rules) logger.success(`Loaded ${ctx.config.state.rulesFile}`);

  // 4. Load context snapshot
  const contextBuilder = new ContextBuilder(ctx.projectRoot, ctx.config.state.contextFile);
  const projectSnapshot = contextBuilder.read() ?? '';

  // 5. Resolve installed skills
  const resolver = new SkillResolver();
  const bundledDir = getBundledSkillsDir();
  const installedNames = Object.keys(ctx.config.skills);
  const skills = resolver.listInstalled(ctx.projectRoot, installedNames, bundledDir);

  // 6. Build agent context
  const agentContext: AgentContext = {
    sessionState: enrichedSessionState,
    notes: recentNotes,
    rules,
    skills,
    projectSnapshot,
    projectName: contextBuilder.getProjectName(),
  };

  // 7. Resolve IDE adapter
  const ideOverride = options.ide ?? ctx.config.ide;
  const adapter = resolveAdapter(ideOverride, ctx.projectRoot);

  if (!adapter) {
    logger.error('No IDE detected and no --ide specified.');
    logger.hint('Run: agentic-skill session start --ide opencode');
    logger.hint('Or run: agentic-skill init to configure your IDE.');
    process.exit(1);
  }

  await adapter.injectContext(agentContext, ctx.projectRoot);
  logger.success(`Injected context → ${adapter.contextFilePath}`);

  // 7b. Load kanban context
  const kanban = new KanbanManager(ctx.projectRoot);
  const board = kanban.readBoard();
  const phaseProgress = kanban.getPhaseProgress();
  const inProgress = kanban.getCurrentTasks();
  const summary = kanban.getSummary();

  // Load AGENT_QUICK_REF.md if it exists
  const agentRefPath = join(ctx.projectRoot, '.agentic', 'AGENT_QUICK_REF.md');
  const agentRef = existsSync(agentRefPath) ? readFileSync(agentRefPath, 'utf-8') : '';

  // Append kanban + phase info to session state string for IDE injection
  const kanbanItems = inProgress.map((t) => `- [${t.id}] ${t.title}`).join('\n');
  const kanbanBlock = board
    ? `\n## Kanban — Current Phase: ${board.currentPhase}\n- In progress: ${summary['in-progress']} tasks  Todo: ${summary.todo}  Phase: ${phaseProgress.completed}/${phaseProgress.total} (${phaseProgress.percent}%)\n${kanbanItems}`
    : '';
  const enrichedSessionState = formatSessionState(state) + kanbanBlock;

  // 8. Print session summary
  logger.newline();
  logger.section('Session Ready');
  logger.plain(`  IDE:        ${adapter.ideName}`);
  logger.plain(`  Last task:  ${state.currentTask}`);
  logger.plain(`  Status:     ${state.status}`);
  logger.plain(`  Skills:     ${skills.length} active`);
  logger.newline();

  if (state.status === 'blocked') {
    logger.warn(`Blockers: ${state.blockers.join(', ')}`);
  }

  if (state.nextSteps.length > 0) {
    logger.hint(`Next: ${state.nextSteps[0]}`);
  }
}

export async function sessionEndCommand(
  _options: SessionOptions,
  ctx: AppContext
): Promise<void> {
  const ideConfig = ctx.config.ide;
  const adapter = resolveAdapter(ideConfig, ctx.projectRoot);

  if (adapter) {
    await adapter.clearContext(ctx.projectRoot);
    logger.success(`Cleared context from ${adapter.ideName}`);
  }

  const sessionMgr = new SessionStateManager(ctx.projectRoot, ctx.config.state.sessionFile);
  sessionMgr.update({ status: 'saved' });
  logger.success('Session state saved.');
}

export async function sessionStatusCommand(
  _options: SessionOptions,
  ctx: AppContext
): Promise<void> {
  const sessionMgr = new SessionStateManager(ctx.projectRoot, ctx.config.state.sessionFile);
  const state = sessionMgr.read();

  if (!state) {
    logger.warn('No session state found.');
    logger.hint("Run 'agentic-skill session start' to begin.");
    return;
  }

  logger.section('Session Status');
  logger.plain(`  Sprint:       ${state.currentSprint}`);
  logger.plain(`  Task:         ${state.currentTask}`);
  logger.plain(`  Status:       ${state.status}`);
  logger.plain(`  Last updated: ${state.lastUpdated}`);

  if (state.blockers.length > 0) {
    logger.newline();
    logger.warn('Blockers:');
    state.blockers.forEach((b) => logger.plain(`  • ${b}`));
  }

  if (state.nextSteps.length > 0) {
    logger.newline();
    logger.plain('Next steps:');
    state.nextSteps.forEach((s) => logger.plain(`  • ${s}`));
  }
}

export async function sessionUpdateCommand(
  partial: { task?: string; status?: string; next?: string; blocker?: string },
  ctx: AppContext
): Promise<void> {
  const sessionMgr = new SessionStateManager(ctx.projectRoot, ctx.config.state.sessionFile);
  const current = sessionMgr.readOrDefault();

  const updated = sessionMgr.update({
    ...(partial.task ? { currentTask: partial.task } : {}),
    ...(partial.status ? { status: partial.status as 'in-progress' } : {}),
    ...(partial.next
      ? { nextSteps: [...current.nextSteps, partial.next] }
      : {}),
    ...(partial.blocker
      ? { blockers: [...current.blockers, partial.blocker] }
      : {}),
  });

  logger.success('SESSION_STATE.md updated.');
  logger.plain(`  Task:   ${updated.currentTask}`);
  logger.plain(`  Status: ${updated.status}`);
}

function formatSessionState(state: ReturnType<SessionStateManager['readOrDefault']>): string {
  const lines = [
    `- **Sprint:** ${state.currentSprint}`,
    `- **Task:** ${state.currentTask}`,
    `- **Status:** ${state.status}`,
    `- **Last updated:** ${state.lastUpdated}`,
  ];

  if (state.blockers.length > 0) {
    lines.push(`- **Blockers:** ${state.blockers.join(', ')}`);
  }

  if (state.nextSteps.length > 0) {
    lines.push(`- **Next steps:**`);
    state.nextSteps.forEach((s) => lines.push(`  - ${s}`));
  }

  return lines.join('\n');
}
