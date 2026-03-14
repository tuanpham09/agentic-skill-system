#!/usr/bin/env node
import { program } from 'commander';
import { buildContext } from './utils/context.js';
import { initCommand } from './commands/init.js';
import { addCommand } from './commands/add.js';
import { removeCommand } from './commands/remove.js';
import { listCommand } from './commands/list.js';
import { updateCommand } from './commands/update.js';
import { statusCommand } from './commands/status.js';
import { sessionStartCommand, sessionEndCommand, sessionStatusCommand, sessionUpdateCommand } from './commands/session.js';
import { searchCommand, publishCommand, loginCommand, notesAddCommand, notesListCommand } from './commands/misc.js';
import { boardCommand } from './commands/board.js';
import { taskAddCommand, taskDoneCommand, taskMoveCommand, taskListCommand } from './commands/task.js';
import { phaseStatusCommand, phaseCompleteCommand, phaseViewCommand } from './commands/phase.js';
import { guideCommand } from './commands/guide.js';
import { proposeCommand } from './commands/propose.js';

program.name('agentic-skill').description('AI coding agent framework — skills, memory, kanban, IDE integration').version('1.0.0');

// ─── init ────────────────────────────────────────────────────────────────────
program.command('init')
  .description('Initialize project: choose IDE, scan codebase or start from idea, generate docs')
  .option('--ide <n>', 'IDE (opencode|cursor|windsurf|claude|copilot|codex)')
  .option('-y, --yes', 'Skip prompts, use defaults')
  .option('--idea <file>', 'Path to idea document to read')
  .option('--no-state', 'Skip creating state files')
  .action(async (options) => { await initCommand(process.cwd(), options); });

// ─── add / remove / list / update ────────────────────────────────────────────
program.command('add <skill>')
  .description('Install a skill from registry or local path')
  .option('--local', 'Install to .skills/ (project-local)')
  .option('--version <ver>', 'Specific version')
  .action(async (skill, options) => { await addCommand(skill, options, buildContext()); });

program.command('remove <skill>')
  .description('Uninstall a skill')
  .action((skill, options) => { removeCommand(skill, options, buildContext()); });

program.command('list')
  .description('List installed skills')
  .option('--global').option('--local').option('--json')
  .action((options) => { listCommand(options, buildContext()); });

program.command('update [skill]')
  .description('Update installed skills')
  .option('--check', 'Show available updates without installing')
  .action(async (skill, options) => { await updateCommand(skill, options, buildContext()); });

// ─── status ───────────────────────────────────────────────────────────────────
program.command('status')
  .description('Full project overview: session, skills, phases, kanban summary')
  .option('--json')
  .action(async (options) => { await statusCommand(options, buildContext()); });

// ─── session ─────────────────────────────────────────────────────────────────
const session = program.command('session').description('Manage AI agent sessions');
session.command('start').option('--ide <n>').action(async (options) => { await sessionStartCommand(options, buildContext()); });
session.command('end').action(async () => { await sessionEndCommand({}, buildContext()); });
session.command('status').action(async () => { await sessionStatusCommand({}, buildContext()); });
session.command('resume').option('--ide <n>').action(async (options) => { await sessionStartCommand(options, buildContext()); });
session.command('update')
  .option('--task <description>').option('--status <status>').option('--next <step>').option('--blocker <b>')
  .action(async (options) => { await sessionUpdateCommand(options, buildContext()); });

// ─── board ───────────────────────────────────────────────────────────────────
program.command('board')
  .description('View kanban board — tasks by status across current phase')
  .option('--phase <name>', 'Filter by phase')
  .option('--status <status>', 'Filter by status')
  .option('--json')
  .action((options) => { boardCommand(options, buildContext()); });

// ─── task ─────────────────────────────────────────────────────────────────────
const task = program.command('task').description('Manage kanban tasks');
task.command('add <title>').option('--phase <p>').option('--priority <p>').option('--feature <f>')
  .action((title, options) => { taskAddCommand(title, options, buildContext()); });
task.command('done <id>')
  .action((id) => { taskDoneCommand(id, buildContext()); });
task.command('move <id> <status>')
  .action((id, status) => { taskMoveCommand(id, status, buildContext()); });
task.command('list').option('--status <s>').option('--phase <p>').option('--json')
  .action((options) => { taskListCommand(options, buildContext()); });

// ─── phase ────────────────────────────────────────────────────────────────────
const phase = program.command('phase').description('Manage sprint phases');
phase.command('status').action(() => { phaseStatusCommand(buildContext()); });
phase.command('complete').action(async () => { await phaseCompleteCommand(buildContext()); });
phase.command('view <number>').action((n) => { phaseViewCommand(n, buildContext()); });

// ─── guide ────────────────────────────────────────────────────────────────────
program.command('guide [ide]')
  .description('Show IDE-specific usage guide (opencode|cursor|windsurf|claude|copilot|codex|list)')
  .action((ide) => { guideCommand(ide, buildContext()); });

// ─── propose ─────────────────────────────────────────────────────────────────
program.command('propose [feature]')
  .description('Create a feature proposal in .agentic/openspec/changes/')
  .option('--priority <p>', 'high|medium|low')
  .action(async (feature, options) => { await proposeCommand(feature, options, buildContext()); });

// ─── search / publish / login ─────────────────────────────────────────────────
program.command('search <query>').option('--limit <n>').action(async (q, opts) => { await searchCommand(q, { limit: opts.limit ? parseInt(opts.limit) : 10 }, buildContext()); });
program.command('publish <path>').option('--dry-run').option('--tag <t>').action(async (p, opts) => { await publishCommand(p, opts, buildContext()); });
program.command('login').option('--token <t>').option('--registry <url>').action(async (opts) => { await loginCommand(opts, buildContext()); });

// ─── notes ────────────────────────────────────────────────────────────────────
const notes = program.command('notes').description('Manage architecture notes');
notes.command('add <content>').action((c) => { notesAddCommand(c, buildContext()); });
notes.command('list').action(() => { notesListCommand(buildContext()); });

// ─── skill validate-all (CI) ──────────────────────────────────────────────────
const skillCmd = program.command('skill').description('Skill management utilities');
skillCmd.command('validate-all').action(async () => {
  const { getBundledSkillsDir } = await import('./utils/context.js');
  const { SkillValidator } = await import('@agentic-skill/core');
  const { readdirSync } = await import('fs');
  const { join } = await import('path');
  const bundledDir = getBundledSkillsDir();
  const validator = new SkillValidator();
  const skills = readdirSync(bundledDir);
  let allValid = true;
  for (const name of skills) {
    const result = validator.validate(join(bundledDir, name));
    if (result.valid) { process.stdout.write(`  ✓ ${name}\n`); }
    else { process.stdout.write(`  ✗ ${name}\n`); result.errors.forEach((e) => process.stdout.write(`    • ${e}\n`)); allValid = false; }
  }
  process.stdout.write(allValid ? `\n✓ All ${skills.length} skills valid\n` : `\n✗ Some skills invalid\n`);
  process.exit(allValid ? 0 : 1);
});

program.parse(process.argv);
