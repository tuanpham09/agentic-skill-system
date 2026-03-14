import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { SessionStateManager, SkillLoader, ConfigLoader, KanbanManager } from '@agentic-skill/core';
import { detectAdapter } from '@agentic-skill/adapters';
import type { AppContext } from '@agentic-skill/core';
import { logger } from '../utils/logger.js';

export async function statusCommand(options: { json?: boolean }, ctx: AppContext): Promise<void> {
  const configLoader = new ConfigLoader();
  if (!configLoader.exists(ctx.projectRoot)) {
    logger.error('Not in an agentic-skill project.'); logger.hint("Run 'agentic-skill init'"); process.exit(1);
  }

  const sessionMgr = new SessionStateManager(ctx.projectRoot, ctx.config.state.sessionFile);
  const state = sessionMgr.read();
  const adapter = detectAdapter(ctx.projectRoot);
  const skillLoader = new SkillLoader();
  const kanban = new KanbanManager(ctx.projectRoot);

  const skills: Array<{ name: string; version: string; scope: string }> = [];
  const localDir = join(ctx.projectRoot, '.skills');
  if (existsSync(localDir)) {
    for (const name of readdirSync(localDir)) {
      try { const m = skillLoader.loadMeta(join(localDir, name)); skills.push({ name: m.name, version: m.version, scope: 'local' }); } catch {}
    }
  }
  const seen = new Set(skills.map((s) => s.name));
  const globalDir = join(homedir(), '.agentic-skills', 'skills');
  if (existsSync(globalDir)) {
    for (const entry of readdirSync(globalDir)) {
      try { const m = skillLoader.loadMeta(join(globalDir, entry)); if (!seen.has(m.name)) skills.push({ name: m.name, version: m.version, scope: 'global' }); } catch {}
    }
  }

  const board = kanban.readBoard();
  const phases = kanban.readPhases();
  const summary = kanban.getSummary();
  const progress = kanban.getPhaseProgress();

  if (options.json) {
    logger.plain(JSON.stringify({ state, skills, ide: adapter?.ideName ?? 'none', board: board ? { currentPhase: board.currentPhase, summary } : null }, null, 2));
    return;
  }

  logger.section('Project Status');
  logger.plain(`  Config:   .agentic.json ✓`);
  logger.plain(`  IDE:      ${adapter?.ideName ?? 'none detected'} (run: agentic-skill guide for setup help)`);
  if (ctx.config.project) {
    logger.plain(`  Language: ${ctx.config.project.language}${ctx.config.project.framework ? ` / ${ctx.config.project.framework}` : ''}`);
    logger.plain(`  Type:     ${ctx.config.project.type}`);
  }

  logger.newline();
  logger.plain('Session State:');
  if (state) {
    logger.plain(`  Sprint:  ${state.currentSprint}`);
    logger.plain(`  Task:    ${state.currentTask}`);
    logger.plain(`  Status:  ${state.status}`);
    if (state.blockers.length > 0) logger.warn(`  Blockers: ${state.blockers.join(', ')}`);
  } else { logger.plain('  (no session — run: agentic-skill session start)'); }

  if (board) {
    logger.newline();
    logger.plain(`Phase Progress: ${progress.completed}/${progress.total} complete (${progress.percent}%)`);
    if (phases) {
      const current = phases.phases.find((p) => p.id === phases.currentPhaseId);
      if (current) logger.plain(`  Current: ${current.name}`);
    }
    logger.plain(`Tasks: in-progress: ${summary['in-progress']}  todo: ${summary.todo}  blocked: ${summary.blocked}  done: ${summary.done}`);
    logger.hint("agentic-skill board — full kanban view");
    logger.hint("agentic-skill phase status — phase breakdown");
  }

  logger.newline();
  logger.plain(`Skills (${skills.length} installed):`);
  if (skills.length === 0) { logger.plain('  (none)'); }
  else { for (const s of skills.slice(0, 5)) logger.plain(`  ${s.name.padEnd(30)} ${s.version} [${s.scope}]`); if (skills.length > 5) logger.plain(`  ... and ${skills.length - 5} more`); }

  logger.divider();
  logger.hint("agentic-skill session start — begin coding session");
  logger.hint("agentic-skill guide — IDE setup guide");
}
