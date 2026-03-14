import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import type { SessionState, SessionStatus } from '../types/index.js';

const DEFAULT_STATE: SessionState = {
  currentSprint: 'Sprint 1',
  currentTask: 'Not started',
  status: 'not-started',
  lastUpdated: new Date().toISOString(),
  blockers: [],
  nextSteps: [],
};

export class SessionStateManager {
  private filePath: string;

  constructor(
    private projectRoot: string,
    filename = 'SESSION_STATE.md'
  ) {
    this.filePath = join(projectRoot, filename);
  }

  read(): SessionState | null {
    if (!existsSync(this.filePath)) return null;
    try {
      const { data } = matter(readFileSync(this.filePath, 'utf-8'));
      return {
        currentSprint: String(data['currentSprint'] ?? 'Sprint 1'),
        currentTask: String(data['currentTask'] ?? 'Not started'),
        status: (data['status'] as SessionStatus) ?? 'not-started',
        lastUpdated: String(data['lastUpdated'] ?? new Date().toISOString()),
        blockers: Array.isArray(data['blockers']) ? (data['blockers'] as string[]) : [],
        nextSteps: Array.isArray(data['nextSteps']) ? (data['nextSteps'] as string[]) : [],
      };
    } catch {
      return null;
    }
  }

  readOrDefault(): SessionState {
    return this.read() ?? { ...DEFAULT_STATE };
  }

  write(state: SessionState): void {
    const frontmatter = {
      currentSprint: state.currentSprint,
      currentTask: state.currentTask,
      status: state.status,
      lastUpdated: new Date().toISOString(),
      blockers: state.blockers,
      nextSteps: state.nextSteps,
    };

    const body = this.buildBody(state);
    const content = matter.stringify(body, frontmatter);
    writeFileSync(this.filePath, content, 'utf-8');
  }

  update(partial: Partial<SessionState>): SessionState {
    const current = this.readOrDefault();
    const updated: SessionState = { ...current, ...partial };
    this.write(updated);
    return updated;
  }

  createDefault(): void {
    if (!existsSync(this.filePath)) {
      this.write({ ...DEFAULT_STATE });
    }
  }

  exists(): boolean {
    return existsSync(this.filePath);
  }

  private buildBody(state: SessionState): string {
    const nextStepsList =
      state.nextSteps.length > 0
        ? state.nextSteps.map((s) => `- ${s}`).join('\n')
        : '- (none)';

    const blockersList =
      state.blockers.length > 0
        ? state.blockers.map((b) => `- ${b}`).join('\n')
        : '- None';

    return `
## Current Task

${state.currentTask}

## Next Steps

${nextStepsList}

## Blockers

${blockersList}
`;
  }
}
