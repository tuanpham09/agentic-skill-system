import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { KanbanBoard, KanbanTask, KanbanStatus, PhasePlan, Phase, PhaseStatus } from '../types/index.js';

const BOARD_FILE = '.agentic/board.json';
const PHASES_FILE = '.agentic/phases.json';

export class KanbanManager {
  private boardPath: string;
  private phasesPath: string;

  constructor(private projectRoot: string) {
    this.boardPath = join(projectRoot, BOARD_FILE);
    this.phasesPath = join(projectRoot, PHASES_FILE);
  }

  // ─── Board ─────────────────────────────────────────────────────────────────

  readBoard(): KanbanBoard | null {
    if (!existsSync(this.boardPath)) return null;
    try {
      return JSON.parse(readFileSync(this.boardPath, 'utf-8')) as KanbanBoard;
    } catch { return null; }
  }

  writeBoard(board: KanbanBoard): void {
    mkdirSync(join(this.projectRoot, '.agentic'), { recursive: true });
    board.lastUpdated = new Date().toISOString();
    writeFileSync(this.boardPath, JSON.stringify(board, null, 2) + '\n', 'utf-8');
  }

  initBoard(projectName: string, currentPhase: string): KanbanBoard {
    const board: KanbanBoard = {
      projectName,
      currentPhase,
      lastUpdated: new Date().toISOString(),
      tasks: [],
      completedPhases: [],
    };
    this.writeBoard(board);
    return board;
  }

  addTask(task: Omit<KanbanTask, 'id' | 'createdAt' | 'updatedAt'>): KanbanTask {
    const board = this.readBoard() ?? this.initBoard('project', 'Phase 1');
    const newTask: KanbanTask = {
      ...task,
      id: `task-${randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    board.tasks.push(newTask);
    this.writeBoard(board);
    return newTask;
  }

  updateTaskStatus(taskId: string, status: KanbanStatus, notes?: string): boolean {
    const board = this.readBoard();
    if (!board) return false;

    const task = board.tasks.find((t) => t.id === taskId);
    if (!task) return false;

    task.status = status;
    task.updatedAt = new Date().toISOString();
    if (status === 'done') {
      task.completedAt = new Date().toISOString();
    }
    this.writeBoard(board);
    return true;
  }

  getByStatus(status: KanbanStatus): KanbanTask[] {
    return this.readBoard()?.tasks.filter((t) => t.status === status) ?? [];
  }

  getByPhase(phase: string): KanbanTask[] {
    return this.readBoard()?.tasks.filter((t) => t.phase === phase) ?? [];
  }

  getCurrentTasks(): KanbanTask[] {
    return this.getByStatus('in-progress');
  }

  /** Summary counts: { backlog, todo, in-progress, review, done, blocked } */
  getSummary(): Record<KanbanStatus, number> {
    const tasks = this.readBoard()?.tasks ?? [];
    const counts: Record<KanbanStatus, number> = {
      backlog: 0, todo: 0, 'in-progress': 0, review: 0, done: 0, blocked: 0,
    };
    for (const t of tasks) counts[t.status]++;
    return counts;
  }

  // ─── Phases ────────────────────────────────────────────────────────────────

  readPhases(): PhasePlan | null {
    if (!existsSync(this.phasesPath)) return null;
    try {
      return JSON.parse(readFileSync(this.phasesPath, 'utf-8')) as PhasePlan;
    } catch { return null; }
  }

  writePhases(plan: PhasePlan): void {
    mkdirSync(join(this.projectRoot, '.agentic'), { recursive: true });
    plan.lastUpdated = new Date().toISOString();
    writeFileSync(this.phasesPath, JSON.stringify(plan, null, 2) + '\n', 'utf-8');
  }

  initPhases(projectName: string, phaseNames: string[]): PhasePlan {
    const phases: Phase[] = phaseNames.map((name, i) => ({
      id: `phase-${i + 1}`,
      name,
      status: i === 0 ? 'active' : 'planned' as PhaseStatus,
      goal: `Complete ${name}`,
      tasks: [],
      acceptanceCriteria: [],
    }));

    const plan: PhasePlan = {
      projectName,
      phases,
      currentPhaseId: phases[0]?.id ?? 'phase-1',
      lastUpdated: new Date().toISOString(),
    };
    this.writePhases(plan);
    return plan;
  }

  completePhase(phaseId: string, notes?: string): boolean {
    const plan = this.readPhases();
    if (!plan) return false;

    const phase = plan.phases.find((p) => p.id === phaseId);
    if (!phase) return false;

    phase.status = 'completed';
    phase.completedAt = new Date().toISOString();
    if (notes) phase.completionNotes = notes;

    // Activate next phase
    const currentIndex = plan.phases.findIndex((p) => p.id === phaseId);
    const next = plan.phases[currentIndex + 1];
    if (next) {
      next.status = 'active';
      next.startedAt = new Date().toISOString();
      plan.currentPhaseId = next.id;

      // Also mark complete in board
      const board = this.readBoard();
      if (board) {
        board.completedPhases.push(phase.name);
        board.currentPhase = next.name;
        this.writeBoard(board);
      }
    }

    this.writePhases(plan);
    return true;
  }

  getCurrentPhase(): Phase | null {
    const plan = this.readPhases();
    if (!plan) return null;
    return plan.phases.find((p) => p.id === plan.currentPhaseId) ?? null;
  }

  getPhaseProgress(): { completed: number; total: number; percent: number } {
    const plan = this.readPhases();
    if (!plan) return { completed: 0, total: 0, percent: 0 };
    const completed = plan.phases.filter((p) => p.status === 'completed').length;
    const total = plan.phases.length;
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }
}
