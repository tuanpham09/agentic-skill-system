---
name: doc-reviewer
description: >
  Review documentation bundle for consistency, completeness, and agent-readiness.
  Use before starting a sprint, after major feature changes, or when docs feel out of sync
  with code. Triggers: "review docs", "check docs", "validate documentation", "docs consistent".
---

# Doc Reviewer

> **Agent context:** Use this skill to validate that documentation is complete, internally consistent, and reflects the current codebase. Run before handing off to another agent session. Inconsistent docs cause hallucination and wrong-pattern implementations.

---

## When to Use This Skill

- Before starting a new sprint (verify docs from last sprint are accurate)
- After adding a new module, command, or API endpoint
- When code diverges from what's documented
- Before publishing or open-sourcing a component

---

## Step 1 — Check Cross-Reference Integrity

Every file reference in the docs must resolve. Check:

```bash
# List all file paths mentioned in docs (pattern: backtick paths)
grep -r '`[a-z].*\.(md|ts|json)`' docs/ --include="*.md" -h \
  | grep -oP '`[^`]+`' | sort -u
```

For each referenced path, verify it exists:
```bash
# Example: AGENT_QUICK_REF.md references sprints/SPRINT_01.md
ls sprints/SPRINT_01.md     # must exist

# Example: DESIGN_PATTERNS.md references packages/core/src/skill-engine/validator.ts
ls packages/core/src/skill-engine/validator.ts  # must exist
```

---

## Step 2 — Validate Skill Schema Compliance

Every skill in `skills/` must pass the validator:

```bash
# Run built-in validation
node packages/cli/dist/index.js skill validate-all

# Expected: "✓ All 16 skills valid"
# If any fail: fix SKILL.md or skill.json before proceeding
```

For each failing skill, check:
- Does `SKILL.md` start with `---` frontmatter?
- Does it have `> **Agent context:**` block?
- Does it have at least one `## Step N` section?
- Does it have `## Quality Checklist`?
- Does `skill.json` have all required fields?

**Ref:** `modules/SKILL_SCHEMA.md`

---

## Step 3 — API Contract Consistency

Verify CLI command flags in `api/API_REFERENCE.md` match implementation:

```bash
# Check each command's --help output vs the spec:
node packages/cli/dist/index.js --help
node packages/cli/dist/index.js add --help
node packages/cli/dist/index.js session --help
node packages/cli/dist/index.js session start --help
```

Confirm every flag in `api/API_REFERENCE.md` appears in `--help`. If not — update the doc or the command.

---

## Step 4 — Architecture Diagram Accuracy

Review `architecture/SYSTEM_OVERVIEW.md`:

- Does the ASCII architecture diagram match actual package structure?
- Are all environment variables listed in `SYSTEM_OVERVIEW.md` still used?
- Is the command lifecycle flow accurate to `packages/cli/src/commands/`?

Check:
```bash
find packages -name "*.ts" | xargs grep "process.env" | grep "AGENTIC_"
# Compare to env vars table in SYSTEM_OVERVIEW.md
```

---

## Step 5 — Sprint File Currency

For the current sprint:
```bash
cat sprints/SPRINT_0N.md
```

Check each task:
- [ ] P0 tasks completed? → acceptance criteria commands pass
- [ ] Referenced files in `Ref:` lines exist?
- [ ] Handoff checklist updated to reflect actual done state?

---

## Step 6 — AGENT_QUICK_REF.md Completeness

The navigation map must cover every doc file:

```bash
# List all docs
find . -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*" | sort

# Compare to navigation table in AGENT_QUICK_REF.md
# Every doc file should have a row in "I want to... → Read this file"
```

---

## Output / Deliverables

- List of inconsistencies found (if any)
- Updated docs with corrections
- All skill validations passing

---

## Quality Checklist

- [ ] All file cross-references in docs resolve to existing files
- [ ] `agentic-skill skill validate-all` — all 16 skills pass
- [ ] CLI `--help` output matches `api/API_REFERENCE.md`
- [ ] Architecture diagram reflects actual package structure
- [ ] AGENT_QUICK_REF.md navigation map covers all doc files
- [ ] Current sprint handoff checklist items verified
