import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { select, input, confirm } from '@inquirer/prompts';
import {
  ConfigLoader, SessionStateManager, NotesManager, ContextBuilder,
  SkillInstaller,
} from '@agentic-skill/core';
import { LanguageAdapter } from '@agentic-skill/core';
import { DocGenerator } from '@agentic-skill/core';
import { KanbanManager } from '@agentic-skill/core';
import type { ProjectType, DetectedLanguage } from '@agentic-skill/core';
import { logger } from '../utils/logger.js';
import { getBundledSkillsDir } from '../utils/context.js';

interface InitOptions {
  ide?: string;
  yes?: boolean;
  noState?: boolean;
  idea?: string;
}

const IDE_CHOICES = [
  { name: 'OpenCode        (recommended AI-first)', value: 'opencode' },
  { name: 'Cursor          (AI-first, popular)', value: 'cursor' },
  { name: 'Windsurf        (Codeium AI)', value: 'windsurf' },
  { name: 'Claude Code     (Anthropic terminal)', value: 'claude' },
  { name: 'GitHub Copilot  (VS Code)', value: 'copilot' },
  { name: 'Codex CLI       (OpenAI terminal)', value: 'codex' },
  { name: 'Auto-detect     (detect from project files)', value: 'auto' },
];

const IDE_CONTEXT_FILES: Record<string, string> = {
  opencode: '.opencode/context.md',
  cursor: '.cursorrules + .cursor/rules/agentic-context.mdc',
  windsurf: '.windsurfrules',
  claude: 'CLAUDE.md',
  copilot: '.github/copilot-instructions.md',
  codex: 'AGENTS.md',
  auto: '(auto-detected)',
};

const DEFAULT_PHASES = [
  'Phase 1 — Foundation & Setup',
  'Phase 2 — Core Features',
  'Phase 3 — Integration & Testing',
  'Phase 4 — Polish & Deploy',
];

export async function initCommand(projectRoot: string, options: InitOptions): Promise<void> {
  const configLoader = new ConfigLoader();

  if (configLoader.exists(projectRoot) && !options.yes) {
    logger.warn('Already initialized (.agentic.json exists).');
    const reinit = await confirm({ message: 'Re-initialize? This will overwrite existing config.', default: false });
    if (!reinit) return;
  }

  logger.newline();
  logger.plain('  ┌─────────────────────────────────────┐');
  logger.plain('  │  agentic-skill — project setup      │');
  logger.plain('  └─────────────────────────────────────┘');
  logger.newline();

  // ─── Step 1: Choose IDE ──────────────────────────────────────────────────
  let ide = options.ide ?? 'auto';
  if (!options.ide && !options.yes) {
    const detected = detectIde(projectRoot);
    if (detected) logger.info(`Detected: ${detected}`);

    ide = await select({
      message: '① Which IDE are you using?',
      choices: IDE_CHOICES,
      default: detected ?? 'opencode',
    });
  }
  logger.success(`IDE: ${ide}  →  context written to: ${IDE_CONTEXT_FILES[ide] ?? ide}`);

  // ─── Step 2: New project or existing? ───────────────────────────────────
  let projectType: ProjectType = 'new';
  if (!options.yes) {
    projectType = await select({
      message: '② Project type?',
      choices: [
        { name: 'New project  (idea or blank start)', value: 'new' },
        { name: 'Existing project  (scan current codebase)', value: 'existing' },
      ],
    }) as ProjectType;
  }

  // ─── Step 3: Scan or gather idea ─────────────────────────────────────────
  const langAdapter = new LanguageAdapter();
  let projectName = '';
  let description = '';
  let ideaText = options.idea ?? '';

  if (projectType === 'existing') {
    logger.info('Scanning project...');
    const scan = langAdapter.scan(projectRoot);

    projectName = scan.packageName ?? options.yes ? 'my-project' : await input({
      message: 'Project name:',
      default: scan.packageName ?? 'my-project',
    });
    description = scan.description ?? '';

    logger.newline();
    logger.section('Scan results');
    logger.plain(`  Language:   ${scan.language}`);
    if (scan.framework) logger.plain(`  Framework:  ${scan.framework}`);
    logger.plain(`  Tests:      ${scan.hasTests ? 'yes' : 'none detected'}`);
    logger.plain(`  Docker:     ${scan.hasDocker ? 'yes' : 'no'}`);
    logger.plain(`  Size:       ${scan.estimatedSize}`);
    if (scan.existingFeatures.length > 0) {
      logger.plain(`  Features:   ${scan.existingFeatures.slice(0, 5).join(', ')}${scan.existingFeatures.length > 5 ? '...' : ''}`);
    }

    // Generate docs from scan
    const docGen = new DocGenerator(projectRoot);
    docGen.generateAll({ projectName, description, projectRoot, scan, phases: DEFAULT_PHASES });

    // Init kanban from detected features
    const kanban = new KanbanManager(projectRoot);
    kanban.initBoard(projectName, DEFAULT_PHASES[0]!);
    kanban.initPhases(projectName, DEFAULT_PHASES);

    // Add detected features as backlog tasks
    for (const feat of scan.existingFeatures) {
      kanban.addTask({
        title: `Document & test: ${feat}`,
        status: 'backlog',
        phase: DEFAULT_PHASES[0]!,
        priority: 'P2',
        tags: ['existing', 'documentation'],
        feature: feat,
      });
    }

    logger.newline();
    logger.success('Docs generated in .agentic/');
    logger.hint('Next: chat with your AI agent to fill in architecture details');
    logger.hint('It will read .agentic/AGENT_QUICK_REF.md automatically on session start');

  } else {
    // New project
    if (!options.yes) {
      projectName = await input({ message: 'Project name:', default: 'my-project' });
      description = await input({ message: 'One-line description:', default: '' });

      if (!ideaText) {
        const hasIdea = await confirm({ message: 'Do you have an idea doc to read? (markdown/txt file)', default: false });
        if (hasIdea) {
          ideaText = await input({ message: 'Path to idea file (or paste a description):' });
        } else {
          ideaText = await input({ message: 'Describe your project idea (or press Enter to skip):' });
        }
      }
    } else {
      projectName = 'my-project';
    }

    // Generate skeleton docs
    const docGen = new DocGenerator(projectRoot);
    docGen.generateAll({
      projectName, description: description || ideaText.slice(0, 200), projectRoot,
      ideaText, phases: DEFAULT_PHASES,
      initialTasks: ['Project setup & conventions', 'Core domain model', 'First API/UI feature'],
    });

    // Init kanban with starter tasks
    const kanban = new KanbanManager(projectRoot);
    kanban.initBoard(projectName, DEFAULT_PHASES[0]!);
    kanban.initPhases(projectName, DEFAULT_PHASES);

    const starterTasks = [
      { title: 'Define tech stack & conventions', feature: 'setup' },
      { title: 'Set up project structure', feature: 'setup' },
      { title: 'Implement first core feature', feature: 'core' },
    ];
    for (const t of starterTasks) {
      kanban.addTask({ title: t.title, status: 'todo', phase: DEFAULT_PHASES[0]!, priority: 'P1', tags: ['starter'], feature: t.feature });
    }
  }

  // ─── Step 4: Create .agentic.json ────────────────────────────────────────
  configLoader.write(projectRoot, {
    version: '1.0.0',
    skills: {},
    ide: ide as 'opencode' | 'copilot' | 'claude' | 'codex' | 'cursor' | 'windsurf' | 'auto',
    registry: 'https://registry.agentic-skill.dev',
    project: {
      name: projectName,
      type: projectType,
      language: langAdapter.detect(projectRoot),
      docsPath: '.agentic/docs',
      openspecPath: '.agentic/openspec',
      boardPath: '.agentic/board.json',
      phasesPath: '.agentic/phases.json',
      initializedAt: new Date().toISOString(),
      ideGuide: ide,
    },
  });

  // ─── Step 5: Create state files ──────────────────────────────────────────
  if (!options.noState) {
    new SessionStateManager(projectRoot).createDefault();
    new NotesManager(projectRoot).createDefault();
    new ContextBuilder(projectRoot).createDefault();
  }

  // ─── Step 6: Create IDE rules file ───────────────────────────────────────
  await createRulesFile(projectRoot, ide === 'auto' ? (detectIde(projectRoot) ?? 'claude') : ide);

  // ─── Step 7: Install starter skills ──────────────────────────────────────
  const bundledDir = getBundledSkillsDir();
  const installer = new SkillInstaller();
  const starterSkills = ['session-state-manager', 'notes-manager', 'context-builder', 'sprint-executor'];
  let installed = 0;
  for (const skill of starterSkills) {
    const skillPath = join(bundledDir, skill);
    if (existsSync(skillPath)) {
      try { installer.installFromPath(skillPath, projectRoot); installed++; } catch {}
    }
  }

  // ─── Done ─────────────────────────────────────────────────────────────────
  logger.newline();
  logger.plain('  ┌───────────────────────────────────────────────────────┐');
  logger.plain(`  │  ✓ ${projectName.slice(0, 30).padEnd(30)} initialized!           │`);
  logger.plain('  └───────────────────────────────────────────────────────┘');
  logger.newline();
  logger.plain('  Next steps:');
  logger.hint('1. agentic-skill session start       → inject context into your IDE');
  logger.hint('2. agentic-skill board               → view kanban board');
  logger.hint('3. Chat with your agent to fill docs → it reads AGENT_QUICK_REF.md');
  logger.hint('4. agentic-skill guide               → IDE-specific usage guide');
  logger.newline();
}

function detectIde(projectRoot: string): string | null {
  if (existsSync(join(projectRoot, '.opencode'))) return 'opencode';
  if (existsSync(join(projectRoot, '.cursor')) || existsSync(join(projectRoot, '.cursorrules'))) return 'cursor';
  if (existsSync(join(projectRoot, '.windsurfrules'))) return 'windsurf';
  if (existsSync(join(projectRoot, 'CLAUDE.md'))) return 'claude';
  if (existsSync(join(projectRoot, '.github', 'copilot-instructions.md'))) return 'copilot';
  if (existsSync(join(projectRoot, 'AGENTS.md'))) return 'codex';
  return null;
}

async function createRulesFile(projectRoot: string, ide: string): Promise<void> {
  const { mkdirSync } = await import('fs');
  const rulesContent = `# Project Rules

> Auto-created by agentic-skill. Read .agentic/AGENT_QUICK_REF.md first.

## Workflow
1. agentic-skill status           — check state
2. agentic-skill board            — see kanban
3. agentic-skill session start    — begin session
4. Implement → test → commit
5. agentic-skill task done <id>   — mark complete
6. agentic-skill phase complete   — when sprint done

## Critical rules
- Read .agentic/docs/CONVENTIONS.md before writing code
- Tests must pass before marking task done
- Log decisions: agentic-skill notes add "..."
`;

  const fileMap: Record<string, string> = {
    opencode: '.opencode/context.md',
    cursor: '.cursorrules',
    windsurf: '.windsurfrules',
    claude: 'CLAUDE.md',
    copilot: '.github/copilot-instructions.md',
    codex: 'AGENTS.md',
  };

  const targetFile = fileMap[ide];
  if (!targetFile) return;

  if (targetFile.includes('/')) {
    mkdirSync(join(projectRoot, targetFile.split('/').slice(0, -1).join('/')), { recursive: true });
  }

  const fullPath = join(projectRoot, targetFile);
  if (!existsSync(fullPath)) {
    writeFileSync(fullPath, rulesContent, 'utf-8');
  }
}
