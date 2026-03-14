import chalk from 'chalk';
import { KanbanManager } from '@agentic-skill/core';
import type { KanbanTask, KanbanStatus, AppContext } from '@agentic-skill/core';
import { logger } from '../utils/logger.js';

interface BoardOptions {
  phase?: string;
  status?: string;
  json?: boolean;
}

const STATUS_COLORS: Record<KanbanStatus, (s: string) => string> = {
  backlog:      (s) => chalk.gray(s),
  todo:         (s) => chalk.blue(s),
  'in-progress': (s) => chalk.yellow(s),
  review:       (s) => chalk.magenta(s),
  done:         (s) => chalk.green(s),
  blocked:      (s) => chalk.red(s),
};

const STATUS_ICONS: Record<KanbanStatus, string> = {
  backlog: '○',
  todo: '◎',
  'in-progress': '◉',
  review: '◈',
  done: '✓',
  blocked: '✗',
};

const PRIORITY_COLORS: Record<string, (s: string) => string> = {
  P0: (s) => chalk.red(s),
  P1: (s) => chalk.yellow(s),
  P2: (s) => chalk.blue(s),
  P3: (s) => chalk.gray(s),
};

export function boardCommand(options: BoardOptions, ctx: AppContext): void {
  const kanban = new KanbanManager(ctx.projectRoot);
  const board = kanban.readBoard();

  if (!board) {
    logger.error('No kanban board found.');
    logger.hint("Run 'agentic-skill init' to initialize.");
    process.exit(1);
  }

  if (options.json) {
    logger.plain(JSON.stringify(board, null, 2));
    return;
  }

  // Filter tasks
  let tasks = board.tasks;
  if (options.phase) tasks = tasks.filter((t) => t.phase.toLowerCase().includes(options.phase!.toLowerCase()));
  if (options.status) tasks = tasks.filter((t) => t.status === options.status);

  const phases = kanban.readPhases();
  const phaseProgress = kanban.getPhaseProgress();

  // ─── Header ──────────────────────────────────────────────────────────────
  logger.newline();
  logger.plain(chalk.bold(`  ${board.projectName} — Kanban Board`));
  logger.plain(chalk.gray(`  Current phase: ${chalk.white(board.currentPhase)}`));
  logger.plain(chalk.gray(`  Progress: ${phaseProgress.completed}/${phaseProgress.total} phases (${phaseProgress.percent}%)`));

  // ─── Phase progress bar ───────────────────────────────────────────────────
  if (phases) {
    logger.newline();
    logger.plain('  ' + phases.phases.map((p) => {
      if (p.status === 'completed') return chalk.green('█');
      if (p.status === 'active')    return chalk.yellow('▓');
      return chalk.gray('░');
    }).join('') + chalk.gray(` ${phaseProgress.percent}%`));
    logger.plain('  ' + phases.phases.map((p) => {
      const label = p.name.split('—')[0]?.trim().slice(0, 8) ?? '';
      return chalk.gray(label.padEnd(9));
    }).join(''));
  }

  // ─── Summary counts ───────────────────────────────────────────────────────
  const summary = kanban.getSummary();
  logger.newline();
  logger.plain(
    '  ' + Object.entries(STATUS_ICONS).map(([s, icon]) => {
      const count = summary[s as KanbanStatus];
      const colorFn = STATUS_COLORS[s as KanbanStatus];
      return colorFn(`${icon} ${s}: ${count}`);
    }).join('  ')
  );

  // ─── Columns view ─────────────────────────────────────────────────────────
  logger.newline();

  const COLS: KanbanStatus[] = ['todo', 'in-progress', 'review', 'blocked', 'done'];
  for (const col of COLS) {
    const colTasks = tasks.filter((t) => t.status === col);
    if (col !== 'done' || colTasks.length > 0) {
      printColumn(col, colTasks);
    }
  }

  // Show backlog summary
  const backlog = tasks.filter((t) => t.status === 'backlog');
  if (backlog.length > 0) {
    logger.plain(chalk.gray(`\n  ○ Backlog: ${backlog.length} tasks (run 'agentic-skill board --status backlog' to view)`));
  }

  logger.newline();
  logger.plain(chalk.gray('  Commands:'));
  logger.plain(chalk.gray('  agentic-skill task add "Title"          — add task'));
  logger.plain(chalk.gray('  agentic-skill task done <id>            — mark complete'));
  logger.plain(chalk.gray('  agentic-skill task move <id> <status>   — move task'));
  logger.plain(chalk.gray('  agentic-skill phase complete            — complete current phase'));
  logger.newline();
}

function printColumn(status: KanbanStatus, tasks: KanbanTask[]): void {
  const colorFn = STATUS_COLORS[status];
  const icon = STATUS_ICONS[status];

  logger.plain(colorFn(`  ${icon} ${status.toUpperCase().padEnd(14)}`) + chalk.gray(`(${tasks.length})`));

  if (tasks.length === 0) {
    logger.plain(chalk.gray('    — empty'));
    return;
  }

  for (const task of tasks.slice(0, 8)) { // show max 8 per column
    const prioFn = PRIORITY_COLORS[task.priority] ?? ((s: string) => s);
    const id = chalk.gray(`[${task.id}]`);
    const prio = prioFn(`[${task.priority}]`);
    const feature = task.feature ? chalk.gray(` · ${task.feature}`) : '';
    logger.plain(`    ${id} ${prio} ${task.title}${feature}`);
  }
  if (tasks.length > 8) {
    logger.plain(chalk.gray(`    ... and ${tasks.length - 8} more`));
  }
}
