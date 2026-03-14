import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { ProjectScanResult, LanguageProfile } from '../types/index.js';

export interface DocGeneratorOptions {
  projectName: string;
  description: string;
  projectRoot: string;
  scan?: ProjectScanResult;
  ideaText?: string;
}

export class DocGenerator {
  private agenticDir: string;

  constructor(private projectRoot: string) {
    this.agenticDir = join(projectRoot, '.agentic');
  }

  /** Create the full .agentic/ directory structure */
  scaffold(): void {
    const dirs = [
      '.agentic',
      '.agentic/docs',
      '.agentic/openspec',
      '.agentic/openspec/specs',
      '.agentic/openspec/changes',
      '.agentic/openspec/archive',
      '.agentic/guides',
    ];
    for (const dir of dirs) {
      mkdirSync(join(this.projectRoot, dir), { recursive: true });
    }
  }

  /** Generate AGENT_QUICK_REF.md from project info */
  generateQuickRef(opts: DocGeneratorOptions): void {
    const { projectName, description, scan } = opts;
    const profile = scan?.profile;
    const lang = profile?.language ?? 'unknown';
    const fw = profile?.framework ?? lang;

    const content = `# Agent Quick Reference — ${projectName}

> **Agent context:** READ THIS FIRST every session. Navigation map, critical rules, current phase, and commands.

---

## Navigation Map

| I want to... | Read this file |
|---|---|
| Understand project overview | \`.agentic/docs/README.md\` |
| See architecture | \`.agentic/docs/ARCHITECTURE.md\` |
| Check current sprint tasks | \`.agentic/docs/SPRINT_CURRENT.md\` |
| See all features planned | \`.agentic/docs/FEATURES.md\` |
| Check tech stack conventions | \`.agentic/docs/CONVENTIONS.md\` |
| See API design | \`.agentic/docs/API.md\` |
| View kanban board | run \`agentic-skill board\` |
| Check phase progress | run \`agentic-skill phase status\` |
| Add a feature proposal | \`.agentic/openspec/changes/\` |
| Find IDE-specific guide | \`.agentic/guides/\` |

---

## Critical Rules

1. Read \`.agentic/docs/CONVENTIONS.md\` before writing any code
2. Check \`SESSION_STATE.md\` before starting — resume from last task
3. Run \`agentic-skill board\` to see what needs doing
4. Update task status after each completion: \`agentic-skill task done <id>\`
5. Mark phase complete when all tasks done: \`agentic-skill phase complete\`
6. Log every architectural decision: \`agentic-skill notes add "..."\`
7. New features go through openspec: \`agentic-skill propose "feature name"\`

---

## Tech Stack Quick Reference

| Layer | Technology |
|---|---|
| Language | ${lang} |
| Framework | ${fw} |
| Test command | \`${profile?.testCommand ?? 'see CONVENTIONS.md'}\` |
| Build command | \`${profile?.buildCommand ?? 'see CONVENTIONS.md'}\` |
| Run command | \`${profile?.runCommand ?? 'see CONVENTIONS.md'}\` |

---

## Session Resume Checklist

\`\`\`bash
agentic-skill status          # project + session state
agentic-skill board           # kanban overview
agentic-skill phase status    # where we are in the plan
agentic-skill session start   # inject context into IDE
\`\`\`
`;
    writeFileSync(join(this.agenticDir, 'AGENT_QUICK_REF.md'), content, 'utf-8');
  }

  /** Generate README.md for the project */
  generateReadme(opts: DocGeneratorOptions): void {
    const { projectName, description, scan } = opts;
    const techStack = scan?.techStack ?? [];
    const stackTable = techStack.length > 0
      ? techStack.map((t) => `| ${t.category} | ${t.name}${t.version ? ` \`${t.version}\`` : ''} |`).join('\n')
      : '| (to be filled) | - |';

    const features = scan?.existingFeatures ?? [];
    const featureList = features.length > 0
      ? features.map((f) => `- ${f}`).join('\n')
      : '- (agent will fill this during setup chat)';

    const content = `# ${projectName}

> ${description || '(description to be filled during setup)'}

---

## Tech Stack

| Layer | Technology |
|---|---|
${stackTable}

---

## Features

${featureList}

---

## Quick Start

\`\`\`bash
${scan?.profile.installCommand ?? '# install command here'}
${scan?.profile.runCommand ?? '# run command here'}
\`\`\`

---

## Project Structure

\`\`\`
${projectName}/
├── .agentic/               ← AI agent workspace
│   ├── AGENT_QUICK_REF.md  ← Agent reads this first
│   ├── board.json          ← Kanban state
│   ├── phases.json         ← Sprint/phase tracking
│   ├── docs/               ← Architecture docs
│   ├── openspec/           ← Feature proposals
│   └── guides/             ← IDE-specific guides
└── (your project files)
\`\`\`

---

*Docs managed by [agentic-skill](https://github.com/agentic-skill/agentic-skill-system)*
`;
    writeFileSync(join(this.agenticDir, 'docs', 'README.md'), content, 'utf-8');
  }

  /** Generate CONVENTIONS.md — language/framework specific rules */
  generateConventions(opts: DocGeneratorOptions): void {
    const { projectName, scan } = opts;
    const profile = scan?.profile;

    const content = `# Conventions — ${projectName}

> **Agent context:** Read before writing ANY code. These are the non-negotiable rules for this project.

---

## Commands

| Action | Command |
|---|---|
| Install dependencies | \`${profile?.installCommand ?? 'install'}\` |
| Run tests | \`${profile?.testCommand ?? 'test'}\` |
| Build | \`${profile?.buildCommand ?? 'build'}\` |
| Lint | \`${profile?.lintCommand ?? 'lint'}\` |
| Start dev server | \`${profile?.runCommand ?? 'run'}\` |

---

## Test file naming

Pattern: \`${profile?.testFilePattern ?? '**/*.test.*'}\`

Always write tests before implementation (TDD). Tests must pass before marking task done.

---

## Code style

(Agent will fill this after scanning existing code or during setup chat)

- Naming conventions: TBD
- File structure: TBD
- Error handling: TBD

---

## Git workflow

\`\`\`
feat/branch-name   ← new feature
fix/branch-name    ← bug fix
chore/branch-name  ← maintenance
\`\`\`

Commit format: \`type(scope): description\`

---

## Anti-patterns

(Agent will add discovered anti-patterns here over time)
`;
    writeFileSync(join(this.agenticDir, 'docs', 'CONVENTIONS.md'), content, 'utf-8');
  }

  /** Generate ARCHITECTURE.md */
  generateArchitecture(opts: DocGeneratorOptions): void {
    const { projectName, description, scan } = opts;

    const content = `# Architecture — ${projectName}

> **Agent context:** Read this to understand how the system is structured. Update this when architecture changes.

---

## Overview

${description || '(to be filled during setup chat with agent)'}

---

## System diagram

\`\`\`
(Agent will generate this during setup)
\`\`\`

---

## Modules

| Module | Responsibility | Status |
|---|---|---|
| (to be filled) | - | planned |

---

## Data flow

(To be filled during setup)

---

## Key decisions

(Agent will log architectural decisions here via \`agentic-skill notes add\`)
`;
    writeFileSync(join(this.agenticDir, 'docs', 'ARCHITECTURE.md'), content, 'utf-8');
  }

  /** Generate FEATURES.md — feature list with status */
  generateFeatures(opts: DocGeneratorOptions & { phases?: string[] }): void {
    const { projectName, scan, phases } = opts;
    const existing = scan?.existingFeatures ?? [];
    const phaseList = phases ?? ['Phase 1 — Foundation', 'Phase 2 — Core features', 'Phase 3 — Polish & deploy'];

    const existingSection = existing.length > 0
      ? existing.map((f) => `| ${f} | existing | done |`).join('\n')
      : '| (scan detected none) | - | - |';

    const content = `# Features — ${projectName}

> **Agent context:** This is the canonical feature list. Check task status in kanban: \`agentic-skill board\`. Update when features are added, changed, or completed.

---

## Feature status

| Feature | Phase | Status |
|---|---|---|
${existingSection}
| (new features go here) | - | planned |

---

## Phases

${phaseList.map((p, i) => `### ${p}\n\n(Tasks defined in kanban — run \`agentic-skill phase view ${i + 1}\`)\n`).join('\n')}

---

## Adding new features

\`\`\`bash
agentic-skill propose "Feature name"
# Creates: .agentic/openspec/changes/feature-name.md
# Agent will fill in requirements, scope, tasks
\`\`\`
`;
    writeFileSync(join(this.agenticDir, 'docs', 'FEATURES.md'), content, 'utf-8');
  }

  /** Generate initial SPRINT_CURRENT.md */
  generateSprintDoc(opts: DocGeneratorOptions & { phase: string; tasks?: string[] }): void {
    const { projectName, phase, tasks } = opts;

    const taskList = (tasks ?? ['Define project conventions', 'Set up development environment', 'Implement first feature']).map(
      (t, i) => `### Task ${i + 1} — ${t}\n\n**Status:** todo  \n**Priority:** P${i === 0 ? '0' : '1'}\n`
    ).join('\n');

    const content = `# ${phase} — ${projectName}

> **Agent context:** Current active sprint. Read this to know what to implement. Check off tasks as they are done.

---

## Sprint goal

(Agent fills this during planning)

---

## Tasks

${taskList}

---

## Acceptance criteria

All tasks must:
- [ ] Have tests passing (\`${opts.scan?.profile.testCommand ?? 'run tests'}\`)
- [ ] Be marked done in kanban (\`agentic-skill task done <id>\`)
- [ ] Have decisions logged to NOTES.md

---

## Sprint complete when

\`\`\`bash
agentic-skill phase complete
# → Marks this phase done, activates next phase
\`\`\`
`;
    writeFileSync(join(this.agenticDir, 'docs', 'SPRINT_CURRENT.md'), content, 'utf-8');
  }

  /** Create empty OpenSpec proposal template */
  generateOpenSpecTemplate(): void {
    const template = `# Feature Proposal Template

> Copy this file to \`.agentic/openspec/changes/your-feature-name.md\` to propose a new feature.
> Then chat with your AI agent to fill in the details.

---
title: "Feature name"
status: proposal
proposedBy: developer
createdAt: ${new Date().toISOString().slice(0, 10)}
priority: medium
---

## Problem

What problem does this solve?

## Proposed solution

What should be built?

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Out of scope

What is explicitly NOT included?

## Effort estimate

Small / Medium / Large
`;
    writeFileSync(join(this.agenticDir, 'openspec', 'PROPOSAL_TEMPLATE.md'), template, 'utf-8');
  }

  /** Generate all docs in one call */
  generateAll(opts: DocGeneratorOptions & { phases?: string[]; initialTasks?: string[] }): void {
    this.scaffold();
    this.generateQuickRef(opts);
    this.generateReadme(opts);
    this.generateConventions(opts);
    this.generateArchitecture(opts);
    this.generateFeatures(opts);
this.generateSprintDoc({
  ...opts,
  phase: opts.phases?.[0] ?? 'Phase 1 — Foundation',
  ...(opts.initialTasks !== undefined && { tasks: opts.initialTasks }),
});
    this.generateOpenSpecTemplate();
  }
}
