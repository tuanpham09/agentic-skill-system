import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { ConfigLoader } from './loader.js';

describe('ConfigLoader', () => {
  let tmpDir: string;
  let loader: ConfigLoader;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `agentic-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
    loader = new ConfigLoader();
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('loads defaults when no config files exist', () => {
    const config = loader.load(tmpDir);
    expect(config.version).toBe('1.0.0');
    expect(config.ide).toBe('auto');
    expect(config.skills).toEqual({});
    expect(config.registry).toBe('https://registry.agentic-skill.dev');
    expect(config.state.sessionFile).toBe('SESSION_STATE.md');
  });

  it('loads local config overriding defaults', () => {
    writeFileSync(
      join(tmpDir, '.agentic.json'),
      JSON.stringify({ ide: 'opencode', skills: { 'tdd-pipeline': '^1.0.0' } })
    );
    const config = loader.load(tmpDir);
    expect(config.ide).toBe('opencode');
    expect(config.skills['tdd-pipeline']).toBe('^1.0.0');
  });

  it('throws on invalid config', () => {
    writeFileSync(
      join(tmpDir, '.agentic.json'),
      JSON.stringify({ ide: 'unknown-ide' })
    );
    expect(() => loader.load(tmpDir)).toThrow('Invalid .agentic.json');
  });

  it('throws on malformed JSON', () => {
    writeFileSync(join(tmpDir, '.agentic.json'), '{ invalid json }');
    expect(() => loader.load(tmpDir)).toThrow('Failed to parse JSON');
  });

  it('exists() returns false when no config', () => {
    expect(loader.exists(tmpDir)).toBe(false);
  });

  it('exists() returns true after write()', () => {
    loader.write(tmpDir, { ide: 'claude' });
    expect(loader.exists(tmpDir)).toBe(true);
  });

  it('write() merges with existing config', () => {
    loader.write(tmpDir, { ide: 'opencode' });
    loader.write(tmpDir, { skills: { 'tdd-pipeline': '1.0.0' } });
    const config = loader.load(tmpDir);
    expect(config.ide).toBe('opencode');
    expect(config.skills['tdd-pipeline']).toBe('1.0.0');
  });
});
