import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { SessionStateManager } from './session.js';

describe('SessionStateManager', () => {
  let tmpDir: string;
  let manager: SessionStateManager;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `session-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
    manager = new SessionStateManager(tmpDir);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('read() returns null when file does not exist', () => {
    expect(manager.read()).toBeNull();
  });

  it('exists() returns false when file does not exist', () => {
    expect(manager.exists()).toBe(false);
  });

  it('createDefault() creates SESSION_STATE.md', () => {
    manager.createDefault();
    expect(manager.exists()).toBe(true);
  });

  it('createDefault() does not overwrite existing file', () => {
    manager.write({
      currentSprint: 'Sprint 5',
      currentTask: 'My task',
      status: 'in-progress',
      lastUpdated: new Date().toISOString(),
      blockers: [],
      nextSteps: [],
    });
    manager.createDefault(); // should be a no-op
    const state = manager.read();
    expect(state?.currentSprint).toBe('Sprint 5');
  });

  it('write() then read() returns the same state', () => {
    const state = {
      currentSprint: 'Sprint 2',
      currentTask: 'Task 2.3 — Auth middleware',
      status: 'in-progress' as const,
      lastUpdated: '2025-03-14T10:00:00Z',
      blockers: ['Waiting for PR review'],
      nextSteps: ['Task 2.4 — JWT validation'],
    };
    manager.write(state);
    const read = manager.read();

    expect(read?.currentSprint).toBe(state.currentSprint);
    expect(read?.currentTask).toBe(state.currentTask);
    expect(read?.status).toBe(state.status);
    expect(read?.blockers).toEqual(state.blockers);
    expect(read?.nextSteps).toEqual(state.nextSteps);
  });

  it('update() merges partial state', () => {
    manager.write({
      currentSprint: 'Sprint 1',
      currentTask: 'Task 1.1',
      status: 'not-started',
      lastUpdated: new Date().toISOString(),
      blockers: [],
      nextSteps: ['Task 1.2'],
    });

    manager.update({ status: 'done', currentTask: 'Task 1.2' });
    const state = manager.read();

    expect(state?.currentSprint).toBe('Sprint 1'); // unchanged
    expect(state?.status).toBe('done');
    expect(state?.currentTask).toBe('Task 1.2');
  });

  it('readOrDefault() returns default state when file missing', () => {
    const state = manager.readOrDefault();
    expect(state.status).toBe('not-started');
    expect(state.blockers).toEqual([]);
    expect(state.nextSteps).toEqual([]);
  });

  it('handles empty blockers and nextSteps', () => {
    manager.write({
      currentSprint: 'Sprint 1',
      currentTask: 'T',
      status: 'done',
      lastUpdated: new Date().toISOString(),
      blockers: [],
      nextSteps: [],
    });
    const state = manager.read();
    expect(state?.blockers).toEqual([]);
    expect(state?.nextSteps).toEqual([]);
  });
});
