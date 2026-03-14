import { KanbanManager } from '@agentic-skill/core';
import type { AppContext } from '@agentic-skill/core';
import { logger } from '../utils/logger.js';
import { input } from '@inquirer/prompts';

export function phaseStatusCommand(ctx: AppContext): void {
  const kanban = new KanbanManager(ctx.projectRoot);
  const phases = kanban.readPhases();
  const board = kanban.readBoard();

  if (!phases) {
    logger.error('No phase plan found. Run: agentic-skill init');
    process.exit(1);
  }

  const progress = kanban.getPhaseProgress();

  logger.section(`${phases.projectName} — Phase Plan`);
  logger.plain(`  Overall: ${progress.completed}/${progress.total} phases complete (${progress.percent}%)`);
  logger.newline();

  for (const phase of phases.phases) {
    const icon = phase.status === 'completed' ? '✓' : phase.status === 'active' ? '▶' : phase.status === 'skipped' ? '⊘' : '○';
    const statusColor = phase.status === 'completed' ? '\x1b[32m' : phase.status === 'active' ? '\x1b[33m' : '\x1b[90m';
    const reset = '\x1b[0m';

    logger.plain(`  ${statusColor}${icon} ${phase.name}${reset}`);

    if (phase.status === 'active' && board) {
      const phaseTasks = kanban.getByPhase(phase.name);
      const done = phaseTasks.filter((t) => t.status === 'done').length;
      const total = phaseTasks.filter((t) => t.status !== 'backlog').length;
      if (total > 0) logger.plain(`    \x1b[90mTasks: ${done}/${total} complete\x1b[0m`);

      const blocked = phaseTasks.filter((t) => t.status === 'blocked');
      if (blocked.length > 0) logger.plain(`    \x1b[31m⚠ ${blocked.length} blocked task(s)\x1b[0m`);

      const inProgress = phaseTasks.filter((t) => t.status === 'in-progress');
      if (inProgress.length > 0) {
        for (const t of inProgress) logger.plain(`    \x1b[33m◉ [${t.id}] ${t.title}\x1b[0m`);
      }
    }

    if (phase.status === 'completed' && phase.completedAt) {
      logger.plain(`    \x1b[90mCompleted: ${new Date(phase.completedAt).toLocaleDateString()}\x1b[0m`);
    }
  }

  logger.newline();
  logger.hint("'agentic-skill board' — see current tasks");
  logger.hint("'agentic-skill phase complete' — mark current phase done");
}

export async function phaseCompleteCommand(ctx: AppContext): Promise<void> {
  const kanban = new KanbanManager(ctx.projectRoot);
  const current = kanban.getCurrentPhase();

  if (!current) {
    logger.error('No active phase found.');
    process.exit(1);
  }

  // Check if any tasks are still open
  const board = kanban.readBoard();
  if (board) {
    const phaseTasks = kanban.getByPhase(current.name);
    const open = phaseTasks.filter((t) => !['done', 'backlog', 'skipped'].includes(t.status));
    if (open.length > 0) {
      logger.warn(`${open.length} task(s) still open in this phase:`);
      for (const t of open) logger.plain(`  [${t.id}] ${t.status}: ${t.title}`);
      logger.newline();
      logger.plain('Complete them first, or proceed anyway.');
    }
  }

  const notes = await input({
    message: `Completion notes for "${current.name}" (optional):`,
    default: '',
  });

  const ok = kanban.completePhase(current.id, notes || undefined);
  if (!ok) {
    logger.error('Failed to complete phase.');
    process.exit(1);
  }

  logger.newline();
  logger.success(`✓ Phase complete: ${current.name}`);

  // Show next phase
  const phases = kanban.readPhases();
  const next = phases?.phases.find((p) => p.id === phases.currentPhaseId);
  if (next) {
    logger.newline();
    logger.plain(`  Next phase: \x1b[33m${next.name}\x1b[0m`);
    logger.hint("Run 'agentic-skill board' to see tasks for the next phase.");
  } else {
    logger.newline();
    logger.success('🎉 All phases complete! Project done.');
    logger.hint("Run 'agentic-skill status' for a full summary.");
  }

  // Add note to NOTES.md
  const { NotesManager } = await import('@agentic-skill/core');
  const notesMgr = new NotesManager(ctx.projectRoot);
  notesMgr.append(`Phase complete: ${current.name}${notes ? ` — ${notes}` : ''}`);
}

export function phaseViewCommand(phaseNum: string, ctx: AppContext): void {
  const kanban = new KanbanManager(ctx.projectRoot);
  const phases = kanban.readPhases();
  const board = kanban.readBoard();

  if (!phases || !board) {
    logger.error('No phase plan found. Run: agentic-skill init');
    process.exit(1);
  }

  const phase = phases.phases[parseInt(phaseNum) - 1] ?? phases.phases.find((p) => p.name.includes(phaseNum));
  if (!phase) {
    logger.error(`Phase ${phaseNum} not found.`);
    process.exit(1);
  }

  logger.section(phase.name);
  logger.plain(`  Status: ${phase.status}`);
  if (phase.goal) logger.plain(`  Goal: ${phase.goal}`);
  logger.newline();

  const tasks = kanban.getByPhase(phase.name);
  if (tasks.length === 0) {
    logger.plain('  No tasks yet.');
    logger.hint(`Add tasks: agentic-skill task add "Task title" --phase "${phase.name}"`);
    return;
  }

  const grouped: Record<string, typeof tasks> = {};
  for (const t of tasks) {
    (grouped[t.status] ??= []).push(t);
  }

  for (const [status, statusTasks] of Object.entries(grouped)) {
    logger.plain(`  ${status.toUpperCase()} (${statusTasks.length})`);
    for (const t of statusTasks) {
      logger.plain(`    [${t.id}] [${t.priority}] ${t.title}`);
    }
  }
}
