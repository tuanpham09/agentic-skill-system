---
name: context-builder
description: >
  Build or refresh CONTEXT.md — a project snapshot that gives AI agents instant
  orientation in a new session. Use at project start, after major changes, or
  when CONTEXT.md is stale. Triggers: "build context", "update context", "refresh snapshot".
---

# Context Builder

> **Agent context:** Use this skill to create or refresh CONTEXT.md. This file is the single snapshot that lets an AI agent orient itself in under 30 seconds. Run it after major structural changes or when starting a new project phase.

---

## When to Use This Skill

- Initializing a new project (after `agentic-skill init`)
- After completing a sprint or major milestone
- When the project structure has changed significantly
- When CONTEXT.md is missing or visibly outdated
- Before onboarding a new AI session on a complex project

---

## Step 1 — Auto-Build via CLI

```bash
agentic-skill context build
```

This reads `SESSION_STATE.md`, `NOTES.md`, installed skills, and project metadata to generate a fresh `CONTEXT.md`.

---

## Step 2 — Manual Build (if CLI unavailable)

Create `CONTEXT.md` in the project root with this structure:

```markdown
# Project Context Snapshot
> Generated: [DATE]. Run `agentic-skill context build` to refresh.

---

## Project

- **Name:** [project name from package.json]
- **IDE:** [opencode | claude | copilot | codex]
- **Phase:** [e.g. Sprint 2 of 5]

---

## Current Session State

- **Sprint:** [current sprint]
- **Task:** [current task]
- **Status:** [not-started | in-progress | blocked | done]
- **Last updated:** [ISO timestamp]

---

## Installed Skills ([N])

- **skill-name** `version` [scope] — one-line description
- ...

---

## Module Map

| Module | Package | Responsibility |
|---|---|---|
| cli | agentic-skill | User-facing commands |
| core | @agentic-skill/core | Business logic |
| adapters | @agentic-skill/adapters | IDE integrations |

---

## Recent Notes & Decisions

[Last 3-5 notes from NOTES.md]
```

---

## Step 3 — Keep It Fresh

CONTEXT.md should reflect reality. Rules:
- Regenerate after every sprint completion
- Update the "Current Session State" section as tasks progress
- Keep the "Module Map" in sync with `architecture/PROJECT_STRUCTURE.md`
- Never let it get more than 2 sprints out of date

---

## Output / Deliverables

- Updated `CONTEXT.md` in the project root

---

## Quality Checklist

- [ ] CONTEXT.md has a generation timestamp
- [ ] Session state section reflects current `SESSION_STATE.md`
- [ ] Installed skills list is accurate
- [ ] Module map matches actual project structure
- [ ] Recent notes section has at least the last 3 entries from NOTES.md
