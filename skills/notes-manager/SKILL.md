---
name: notes-manager
description: >
  Append architectural decisions, bug findings, and lessons learned to NOTES.md.
  Use when making any technical decision, discovering a pattern, or fixing a non-obvious bug.
  Triggers: "log decision", "add note", "record this", "architecture decision".
---

# Notes Manager

> **Agent context:** Use this skill whenever you make a technical decision, discover something non-obvious, fix a tricky bug, or identify a pattern worth remembering. Append to NOTES.md immediately — never defer it. Future sessions depend on this log.

---

## When to Use This Skill

- You chose one approach over another (and the reason matters)
- You fixed a bug that required non-obvious investigation
- You discovered a constraint or limitation in the codebase
- You changed an architectural pattern
- Something surprised you or took longer than expected

---

## Step 1 — Write the Note

Run this command immediately after making the decision:

```bash
agentic-skill notes add "Your decision or observation here"
```

**Format your note to answer:**
- What did you decide?
- Why did you decide it?
- What alternatives were rejected and why?

**Good note examples:**
```bash
agentic-skill notes add "Switched from callbacks to async/await in registry-client — cleaner error propagation and easier to test with Vitest"

agentic-skill notes add "SkillValidator returns ValidationResult instead of throwing — callers need to present all errors at once, not just the first"

agentic-skill notes add "SQLite chosen for registry MVP; migrate to Postgres after v1.0 — reduces deployment complexity for self-hosting"
```

**Bad note (too vague):**
```bash
agentic-skill notes add "Fixed the bug"  # ← What bug? Why? How?
```

---

## Step 2 — View Recent Notes

```bash
agentic-skill notes list
```

Read notes at the start of every session to re-establish context on past decisions.

---

## Step 3 — Manual Format (if CLI unavailable)

Append directly to `NOTES.md` in this format:

```markdown
## [2025-03-14 10:30] Your decision title here

Detailed explanation of what was decided, why, and what alternatives
were considered and rejected.
```

Rules:
- Never delete existing entries — NOTES.md is append-only
- Keep entries focused: one decision per entry
- Include the date in `[YYYY-MM-DD HH:MM]` format

---

## Output / Deliverables

- An entry appended to `NOTES.md` with timestamp and content

---

## Quality Checklist

- [ ] Note explains **what** was decided, not just **that** something changed
- [ ] Note includes **why** — the reasoning behind the decision
- [ ] Note is appended (not edited/deleted) to NOTES.md
- [ ] Timestamp is in `[YYYY-MM-DD HH:MM]` format
