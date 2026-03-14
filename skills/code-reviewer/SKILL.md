---
name: code-reviewer
description: >
  Review code against project patterns, naming conventions, and quality rules before
  committing. Use after implementing any task. Triggers: "review code", "code review",
  "check my code", "before commit", "is this correct pattern".
---

# Code Reviewer

> **Agent context:** Run this skill after implementing any task, before marking it done. Check the code against the 5 rule categories below. Fix violations before updating SESSION_STATE to "done". This prevents pattern drift across sessions.

---

> **Commands:** Get , ,  from 

## When to Use This Skill

- After implementing any task from a sprint file
- Before running acceptance criteria commands
- When uncertain if the pattern matches project conventions
- Before any git commit

---

## Step 1 — Pattern Compliance Check

Read `architecture/DESIGN_PATTERNS.md` and verify the code uses the correct pattern for its type:

| Code type | Required pattern |
|---|---|
| CLI command | Pattern 1 — Command Handler |
| IDE integration | Pattern 2 — IDE Adapter |
| Skill validation | Pattern 3 — Skill Validator |
| State file ops | Pattern 4 — State Manager |
| Registry calls | Pattern 5 — Registry Client |

**Checklist:**
```
- [ ] Command handlers have no business logic — only parse + call core
- [ ] No raw fs calls in CLI commands — use StateManager, SkillLoader, etc.
- [ ] Adapters are stateless (no instance-level mutable state)
- [ ] Validator always returns ValidationResult — never throws
- [ ] Registry client uses async/await — no callbacks
```

---

## Step 2 — Naming Convention Audit

```bash
# Check file naming (must be kebab-case):
find packages/*/src -name "*.ts" | grep -v "\." | grep "[A-Z]"
# → should return nothing

# Check for console.log (must use logger instead):
grep -rn "console\.\(log\|error\|warn\)" packages/*/src --include="*.ts"
# → should return nothing in production files
```

| Type | Must be | Red flag |
|---|---|---|
| Files | `kebab-case.ts` | `MyFile.ts`, `myFile.ts` |
| Classes | `PascalCase` | `skillValidator`, `skill_validator` |
| Functions | `camelCase` | `LoadSkill()`, `load_skill()` |
| Constants | `UPPER_SNAKE_CASE` | `defaultUrl`, `DefaultUrl` |
| Skill names | `kebab-case` | `tddPipeline`, `TDDPipeline` |

---

## Step 3 — TypeScript Strictness

```bash
# Run type checker:
{{lint_command}}

# Must show 0 errors. Common violations to check for:
```

```typescript
// ❌ Violations:
const data: any = ...          // no any
// @ts-ignore                  // no ts-ignore
const x = arr[0]               // might be undefined in noUncheckedIndexedAccess
function doThing() { ... }     // missing return type annotation

// ✅ Correct:
const data: SkillMeta = ...
const x = arr[0];
if (!x) throw new Error('arr is empty');
function doThing(): Promise<void> { ... }
```

---

## Step 4 — Error Handling Quality

Every error thrown to the user must be actionable:

```typescript
// ❌ Unhelpful:
throw new Error('Failed');
logger.error('Error occurred');

// ✅ Actionable (what + why + what to do):
logger.error(`Skill '${name}' not found in registry.`);
logger.hint(`Run 'agentic-skill search ${name}' to find similar skills.`);
logger.hint(`Browse the full catalog: https://registry.agentic-skill.dev`);
process.exit(1);
```

Check every `catch` block and `process.exit(1)` path has a `logger.hint()`.

---

## Step 5 — Test Coverage

```bash
# Run tests and check coverage:
{{test_command}} --coverage

# Every new module must have a .test.ts file:
find packages/core/src -name "*.ts" | grep -v "\.test\." | grep -v "index\.ts" \
  | while read f; do
    testfile="${f%.ts}.test.ts";
    [ -f "$testfile" ] || echo "MISSING TEST: $testfile";
  done
```

Minimum requirements:
- Happy path: at least 1 test per public method
- Error paths: at least 1 test for each error condition
- No test file with 0 assertions

---

## Output / Deliverables

- List of violations found (if any)
- Fixed code
- All checks passing

---

## Quality Checklist

- [ ] Pattern from `architecture/DESIGN_PATTERNS.md` is used correctly
- [ ] No `console.log` — all output through `logger`
- [ ] No `any` type, no `@ts-ignore`
- [ ] `{{lint_command}}` — 0 errors
- [ ] All error paths have actionable `logger.hint()` messages
- [ ] Every new module has a `.test.ts` file
- [ ] `{{test_command}}` passes (full suite)
- [ ] File names are `kebab-case`, classes are `PascalCase`
