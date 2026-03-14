---
name: feature-proposal
description: >
  Create and manage feature proposals in specs/changes/. Guides the full lifecycle
  from idea to active spec. Use when a user wants to add a new feature or capability.
  Triggers: "add feature", "propose feature", "new feature", "feature request", "I want X to do Y".
---

# Feature Proposal

> **Agent context:** Use this skill when a user describes a new feature or capability they want added. Create a structured proposal file in `specs/changes/` before any code is written. This keeps feature development spec-driven and prevents context drift.

---

## When to Use This Skill

- User says "I want to add X" or "can we add Y feature"
- A new capability is needed that doesn't exist in any sprint
- Extending an existing feature with significant scope
- Any change that would affect the public CLI API or registry API

---

## Step 1 — Gather Requirements

Before writing the proposal, ask (or infer from context):

1. **What problem does this solve?** (the "why")
2. **Who uses this?** (developer / skill author / AI agent / registry admin)
3. **What's the ideal user experience?** (CLI command, output, flow)
4. **What's out of scope?** (important to define boundaries)

---

## Step 2 — Create the Proposal File

```bash
# Name: specs/changes/{feature-slug}.md
touch specs/changes/skill-update-notifications.md
```

Fill it with this template:

```markdown
---
title: "Skill Update Notifications"
status: proposal
proposedBy: developer
createdAt: 2025-03-14
priority: medium
---

## Problem

Users don't know when skill updates are available. They install version 1.0.0
and never upgrade, missing bug fixes and improvements.

## Proposed Solution

Check for skill updates on `agentic-skill session start` and show a summary:

```
ℹ 2 skills have updates available:
  tdd-pipeline: 1.0.0 → 1.1.0
  doc-reviewer: 2.0.0 → 2.1.0
→ Run 'agentic-skill update' to install
```

## User Stories

- As a developer, I want to know when my installed skills have updates
- As a developer, I want to update all skills in one command
- As a developer, I want to see what changed in the new version

## Acceptance Criteria

- [ ] `agentic-skill session start` checks registry for updates (async, non-blocking)
- [ ] Shows update summary if any skills have newer versions
- [ ] `agentic-skill update --check` shows available updates without installing
- [ ] `agentic-skill update` installs all available updates
- [ ] Works in offline mode (skips the check silently)

## Out of Scope

- Auto-update without user confirmation
- Semver range resolution (always suggest latest)
- Changelog display (future enhancement)

## Implementation Notes

- Use `SkillCache.getLatest()` to find installed versions
- Registry call: `GET /api/v1/skills?names=skill1,skill2` (batch endpoint needed)
- Must not block `session start` — run check in background

## Effort Estimate

Small (1-2 tasks, fits in Sprint 5)

## Dependencies

None — requires registry batch endpoint (new work)
```

---

## Step 3 — Update Session State

```bash
agentic-skill notes add "Feature proposal created: skill-update-notifications — Sprint 5 candidate"
```

---

## Step 4 — Proposal Review

When the proposal is reviewed and approved:

1. Move to `specs/` (active):
```bash
mv specs/changes/skill-update-notifications.md specs/skill-update-notifications.md
```

2. Update frontmatter:
```yaml
status: active
approvedAt: 2025-03-15
targetSprint: "Sprint 5"
```

3. Create tasks in the relevant sprint file

---

## Proposal Lifecycle

```
specs/changes/{name}.md    ← proposal (under review)
  │
  │ approved
  ▼
specs/{name}.md            ← active (being implemented)
  │
  │ sprint complete
  ▼
specs/archive/{name}.md    ← archived (done)
```

---

## Output / Deliverables

- `specs/changes/{feature-slug}.md` with complete proposal
- Note logged to `NOTES.md`

---

## Quality Checklist

- [ ] Proposal file created in `specs/changes/`
- [ ] YAML frontmatter has: title, status, proposedBy, createdAt, priority
- [ ] "Problem" section clearly states the user pain
- [ ] Acceptance criteria are measurable and binary (done / not done)
- [ ] "Out of Scope" section explicitly defined
- [ ] Effort estimate provided
- [ ] Note logged to `NOTES.md`
