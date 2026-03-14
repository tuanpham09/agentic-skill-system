---
name: sprint-executor
description: >
  Execute sprint tasks step by step: read the task, implement, test, update state.
  Language-agnostic — reads project conventions. Use at the start of any session.
  Triggers: "execute sprint", "start task", "implement task", "next task", "continue".
---

# Sprint Executor

> **Agent context:** Use this skill at the start of every session. Read the current task from SESSION_STATE.md, implement it following project conventions in `.agentic/docs/CONVENTIONS.md`, then update state. Never start coding without reading the task first.

---

## When to Use This Skill

- Starting a new coding session
- User says "continue", "next task", "what should I work on"
- After completing a task and needing the next one

---

## Step 1 — Orient

```bash
agentic-skill status       # full project state
agentic-skill board        # kanban overview
```

Then read:
1. `SESSION_STATE.md` — current task
2. `.agentic/docs/SPRINT_CURRENT.md` — full sprint tasks
3. `.agentic/docs/CONVENTIONS.md` — this project's build/test commands

---

## Step 2 — Pick and Start the Task

Find the first `todo` or `in-progress` task in the kanban:

```bash
agentic-skill task list --status todo
agentic-skill task move <id> in-progress
agentic-skill session update --task "Phase N / <task title>" --status in-progress
```

---

## Step 3 — Implement (language-agnostic)

```
1. Read task requirements from .agentic/docs/SPRINT_CURRENT.md
2. Write tests first (use tdd-pipeline skill)
3. Implement to pass tests
4. Run: {{test_command}}   ← from .agentic/docs/CONVENTIONS.md
5. Run: {{build_command}}  ← if applicable
```

All commands come from `.agentic/docs/CONVENTIONS.md` — never guess them.

---

## Step 4 — Mark Done

```bash
# Mark task complete in kanban
agentic-skill task done <id>

# Update session state
agentic-skill session update --status done

# Log any decisions made
agentic-skill notes add "Task <id>: implemented X by doing Y because Z"

# Check if all phase tasks done → complete the phase
agentic-skill phase status
# If all done:
agentic-skill phase complete
```

---

## Task Priority Guide

| Priority | Meaning |
|---|---|
| P0 | Blocking — do first |
| P1 | Core sprint goal |
| P2 | Nice-to-have |
| P3 | Backlog |

---

## Output / Deliverables

- Code implemented and tests passing
- Task marked done in kanban
- SESSION_STATE.md updated
- Decisions logged to NOTES.md

---

## Quality Checklist

- [ ] Read full task before writing any code
- [ ] Conventions checked in `.agentic/docs/CONVENTIONS.md`
- [ ] `{{test_command}}` passes
- [ ] Task marked done: `agentic-skill task done <id>`
- [ ] Session state updated: `agentic-skill session update --status done`
- [ ] Decisions logged to NOTES.md
