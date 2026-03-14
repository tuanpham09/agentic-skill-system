import { KanbanManager } from '@agentic-skill/core';
import type { KanbanStatus, AppContext } from '@agentic-skill/core';
import { logger } from '../utils/logger.js';

export function taskAddCommand(title: string, opts: { phase?: string; priority?: string; feature?: string }, ctx: AppContext): void {
  const kanban = new KanbanManager(ctx.projectRoot);
  const board = kanban.readBoard();

  if (!board) {
    logger.error('No kanban board found. Run: agentic-skill init');
    process.exit(1);
  }

const task = kanban.addTask({
  title,
  status: 'todo',
  phase: opts.phase ?? board.currentPhase,
  priority: (opts.priority as 'P0' | 'P1' | 'P2' | 'P3') ?? 'P1',
  tags: [],
  ...(opts.feature !== undefined && { feature: opts.feature }),
});

  logger.success(`Task added: [${task.id}] ${task.title}`);
  logger.hint(`Move to in-progress: agentic-skill task move ${task.id} in-progress`);
}

export function taskDoneCommand(taskId: string, ctx: AppContext): void {
  const kanban = new KanbanManager(ctx.projectRoot);
  const ok = kanban.updateTaskStatus(taskId, 'done');

  if (!ok) {
    logger.error(`Task '${taskId}' not found.`);
    logger.hint("Run 'agentic-skill board' to see task IDs.");
    process.exit(1);
  }

  logger.success(`Task ${taskId} marked done ✓`);

  // Check if all phase tasks are done
  const board = kanban.readBoard();
  if (board) {
    const phaseTasks = kanban.getByPhase(board.currentPhase);
    const remaining = phaseTasks.filter((t) => t.status !== 'done' && t.status !== 'backlog');
    if (remaining.length === 0 && phaseTasks.length > 0) {
      logger.newline();
      logger.success(`All tasks in "${board.currentPhase}" are done!`);
      logger.hint("Run 'agentic-skill phase complete' to mark the phase complete and advance.");
    }
  }
}

export function taskMoveCommand(taskId: string, status: string, ctx: AppContext): void {
  const validStatuses: KanbanStatus[] = ['backlog', 'todo', 'in-progress', 'review', 'done', 'blocked'];
  if (!validStatuses.includes(status as KanbanStatus)) {
    logger.error(`Invalid status: '${status}'`);
    logger.hint(`Valid: ${validStatuses.join(', ')}`);
    process.exit(1);
  }

  const kanban = new KanbanManager(ctx.projectRoot);
  const ok = kanban.updateTaskStatus(taskId, status as KanbanStatus);

  if (!ok) {
    logger.error(`Task '${taskId}' not found.`);
    process.exit(1);
  }

  logger.success(`Task ${taskId} → ${status}`);
}

export function taskListCommand(opts: { status?: string; phase?: string; json?: boolean }, ctx: AppContext): void {
  const kanban = new KanbanManager(ctx.projectRoot);
  const board = kanban.readBoard();

  if (!board) {
    logger.error('No kanban board found.');
    process.exit(1);
  }

  let tasks = board.tasks;
  if (opts.status) tasks = tasks.filter((t) => t.status === opts.status);
  if (opts.phase) tasks = tasks.filter((t) => t.phase.toLowerCase().includes(opts.phase!.toLowerCase()));

  if (opts.json) {
    logger.plain(JSON.stringify(tasks, null, 2));
    return;
  }

  if (tasks.length === 0) {
    logger.plain('No tasks found.');
    return;
  }

  logger.section(`Tasks (${tasks.length})`);
  logger.row(['ID', 'Priority', 'Status', 'Title', 'Feature'], [12, 10, 14, 35, 20]);
  logger.divider();

  for (const t of tasks) {
    logger.row([t.id, t.priority, t.status, t.title.slice(0, 35), t.feature ?? ''], [12, 10, 14, 35, 20]);
  }
}
