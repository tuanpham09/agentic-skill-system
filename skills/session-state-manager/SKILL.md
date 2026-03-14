---
name: session-state-manager
description: >
  Read and write SESSION_STATE.md to track AI agent progress across sessions.
  Also integrates with kanban board for task tracking. Use at session start/end
  and after every task. Triggers: "check session", "resume work", "update task",
  "what was I doing", "session state", "mark done".
---

# Session State Manager

> **Agent context:** Use this skill at the start and end of every session. SESSION_STATE.md is how you remember where you left off. The kanban board (`agentic-skill board`) is where tasks live. Always update both when a task changes status.

---

## When to Use This Skill

- Start of every session: read state to know what to resume
- End of every task: update status and next steps
- When blocked: log the blocker and change status
- When completing a phase: mark it done

---

## Step 1 — Read Current State (Session Start)

```bash
# Get full overview
agentic-skill status

# Get kanban board
agentic-skill board

# Start session (injects context into IDE)
agentic-skill session start
```

The output tells you exactly what to work on next.

---

## Step 2 — Update Task Status

```bash
# When starting a task:
agentic-skill task move <task-id> in-progress
agentic-skill session update --task "Phase N / Task Title" --status in-progress

# When finishing a task:
agentic-skill task done <task-id>
agentic-skill session update --status done

# When blocked:
agentic-skill task move <task-id> blocked
agentic-skill session update --status blocked --blocker "Waiting for X"
```

---

## Step 3 — Direct File Edit (if CLI unavailable)

Edit `SESSION_STATE.md` directly:

```yaml
---
currentSprint: "Phase 2"
currentTask: "Task 2.3 — User authentication"
status: in-progress
lastUpdated: 2025-03-15T10:00:00Z
blockers: []
nextSteps:
  - "Task 2.4 — JWT middleware"
---
```

Valid statuses: `not-started` | `in-progress` | `blocked` | `review` | `done` | `saved`

---

## Step 4 — Complete a Phase

```bash
# When all tasks in current phase are done:
agentic-skill phase complete
# → Marks phase done, activates next phase, logs to NOTES.md
```

---

## Output / Deliverables

- SESSION_STATE.md reflects current task and status
- Kanban board has accurate task statuses

---

## Quality Checklist

- [ ] SESSION_STATE.md updated after every task status change
- [ ] `agentic-skill task done <id>` run when task complete
- [ ] `agentic-skill phase complete` run when all phase tasks done
- [ ] Blockers logged: `agentic-skill session update --blocker "..."`
