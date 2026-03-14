import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { NotesManager } from './notes.js';

describe('NotesManager', () => {
  let tmpDir: string;
  let manager: NotesManager;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `notes-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
    manager = new NotesManager(tmpDir);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('list() returns empty array when file does not exist', () => {
    expect(manager.list()).toEqual([]);
  });

  it('exists() returns false when file does not exist', () => {
    expect(manager.exists()).toBe(false);
  });

  it('createDefault() creates NOTES.md with header', () => {
    manager.createDefault();
    expect(manager.exists()).toBe(true);
  });

  it('append() creates file if it does not exist', () => {
    manager.append('First note');
    expect(manager.exists()).toBe(true);
  });

  it('append() returns entry with timestamp', () => {
    const entry = manager.append('Test decision');
    expect(entry.content).toBe('Test decision');
    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });

  it('list() returns appended notes in reverse chronological order', async () => {
    manager.append('First decision');
    await new Promise((r) => setTimeout(r, 10)); // ensure different timestamps
    manager.append('Second decision');
    await new Promise((r) => setTimeout(r, 10));
    manager.append('Third decision');

    const notes = manager.list();
    expect(notes.length).toBe(3);
    // Most recent first
    expect(notes[0]?.content).toBe('Third decision');
    expect(notes[2]?.content).toBe('First decision');
  });

  it('list() respects the limit parameter', () => {
    for (let i = 0; i < 10; i++) {
      manager.append(`Note ${i}`);
    }
    expect(manager.list(3).length).toBe(3);
    expect(manager.list(10).length).toBe(10);
    expect(manager.list(20).length).toBe(10); // only 10 exist
  });

  it('getRecentText() returns placeholder when no notes', () => {
    const text = manager.getRecentText();
    expect(text).toContain('no notes');
  });

  it('getRecentText() returns formatted notes', () => {
    manager.append('Important architecture decision');
    const text = manager.getRecentText();
    expect(text).toContain('Important architecture decision');
    expect(text).toContain('**[');
  });
});
