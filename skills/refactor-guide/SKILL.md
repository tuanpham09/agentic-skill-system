---
name: refactor-guide
description: >
  Guide safe refactoring sessions: identify code smells, plan changes, refactor with
  tests green throughout. Use when code is working but messy after fast implementation.
  Triggers: "refactor", "clean up code", "code smells", "technical debt", "improve code".
---

# Refactor Guide

> **Agent context:** Use this skill when code works but needs cleanup. The rule is absolute: tests must stay green throughout. Never break a passing test to refactor. Read the code-reviewer skill first to know what the target state looks like.

---

> **Commands:** Get , ,  from 

## When to Use This Skill

- After completing a sprint task quickly (working but messy)
- Sprint 5 polish phase
- When a module is getting too large (> 200 lines)
- When copy-paste duplication appears across commands
- When a function does too many things

---

## Step 1 — Verify Tests Are Green Before Starting

```bash
{{test_command}}
# Must be: all passing, 0 failures

# Commit current state as a safety checkpoint:
git add -A && git commit -m "chore: checkpoint before refactor"
```

---

## Step 2 — Identify Smells

Common smells in this codebase:

| Smell | Example | Fix |
|---|---|---|
| Long function | `initCommand()` > 80 lines | Extract `createRulesFile()`, `installStarterSkills()` |
| Duplicated logic | Same file-read pattern in 3 commands | Extract to `StateManager` method |
| Magic strings | `join(dir, 'SKILL.md')` repeated | Extract `SKILL_MD_FILENAME` constant |
| God object | `AppContext` does routing + config + state | Split responsibilities |
| Missing error type | Generic `catch (err)` everywhere | Use `NotFoundError`, `AuthError` |

```bash
# Find long functions (rough heuristic):
awk '/^  (async )?[a-z].*\(/{count=0; fn=$0} {count++} count>50{print FILENAME ":" NR " — " fn; count=0}' \
  packages/*/src/**/*.ts 2>/dev/null | head -10
```

---

## Step 3 — Refactor Incrementally (One Change at a Time)

**Rule:** Each refactor step must be independently committed and tested.

```bash
# Step 1: Extract constant
# Change code
{{test_command}}  # still green? ✓
git commit -m "refactor: extract SKILL_MD_FILENAME constant"

# Step 2: Extract function
# Change code
{{test_command}}  # still green? ✓
git commit -m "refactor: extract createRulesFile() from initCommand"

# Step 3: ...
```

Never combine multiple refactors in one commit.

---

## Step 4 — Common Refactors for This Codebase

**Extract command helpers:**
```typescript
// Before: 80-line initCommand
export async function initCommand(root, options) {
  // ... 80 lines of mixed logic
}

// After: focused helpers
async function promptForIde(detected: string | null): Promise<string> { ... }
async function installStarterSkills(root: string, bundledDir: string): Promise<void> { ... }
function createRulesFile(root: string, ide: string): void { ... }

export async function initCommand(root, options) {
  const ide = options.ide ?? await promptForIde(detectIde(root));
  await installStarterSkills(root, getBundledSkillsDir());
  createRulesFile(root, ide);
  // now ~20 lines
}
```

**Consolidate duplicated path patterns:**
```typescript
// Before: repeated in 5 commands
const globalDir = join(homedir(), '.agentic-skills', 'skills');

// After: single source of truth in core
export const GLOBAL_SKILLS_DIR = join(homedir(), '.agentic-skills', 'skills');
```

---

## Step 5 — Final Verification

```bash
# All tests still pass:
{{test_command}}

# TypeScript still clean:
{{lint_command}}

# Lint clean:
{{lint_command}}
```

---

## Output / Deliverables

- Cleaner code with the same behavior
- All tests still passing
- Commits with descriptive `refactor:` messages

---

## Quality Checklist

- [ ] `{{test_command}}` — 0 failures before starting
- [ ] Each refactor step committed independently
- [ ] `{{test_command}}` — still 0 failures after each step
- [ ] No functions longer than 50 lines
- [ ] No duplicated code blocks (3+ lines identical)
- [ ] All magic strings extracted to named constants
- [ ] `{{lint_command}}` — 0 errors
