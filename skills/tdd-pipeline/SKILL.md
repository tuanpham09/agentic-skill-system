---
name: tdd-pipeline
description: >
  Red-green-refactor TDD workflow for AI agents. Language-agnostic: uses project's
  detected test command. Use for any new function, module, or bug fix.
  Triggers: "write tests", "tdd", "test first", "implement with tests".
---

# TDD Pipeline

> **Agent context:** Follow this workflow for every piece of new functionality. Write the failing test first — always. Check `.agentic/docs/CONVENTIONS.md` for the project's test command (`{{test_command}}`). Only write implementation after you have a failing test.

---

## When to Use This Skill

- Implementing any new function, class, or module
- Fixing a bug (write a regression test first)
- User says "write tests for X" or "implement X"

---

## Step 1 — Check test command for this project

```bash
# Read from .agentic/docs/CONVENTIONS.md or .agentic.json
cat .agentic/docs/CONVENTIONS.md | grep "Test command"
# Use whatever command is listed there, e.g.:
# pytest / go test ./... / cargo test / ./gradlew test / pnpm test / npm test / bundle exec rspec
```

---

## Step 2 — Write the Failing Test (Red 🔴)

Create the test file alongside or in the test directory for this project's convention:

```
TypeScript/JS:  src/module.test.ts  OR  __tests__/module.test.ts
Python:         test_module.py       OR  tests/test_module.py
Go:             module_test.go
Rust:           src/lib.rs (mod tests block) OR tests/module_test.rs
Java:           src/test/java/.../ModuleTest.java
PHP:            tests/ModuleTest.php
Ruby:           spec/module_spec.rb
```

Write the minimal test describing the desired behavior. Run it — **it must fail**.

---

## Step 3 — Implement to Pass (Green 🟢)

Write the minimal implementation that makes the test pass. Nothing more.

Run: `{{test_command}}`

It must output PASS/OK. If it doesn't — fix the implementation, not the test.

---

## Step 4 — Refactor (Refactor 🔵)

Keep tests green while cleaning up. Run `{{test_command}}` after every change.

**Checklist:**
- [ ] Extract magic strings/numbers to named constants
- [ ] Split methods longer than 20 lines
- [ ] Remove duplication
- [ ] Follow naming conventions from `.agentic/docs/CONVENTIONS.md`

---

## Step 5 — Full Suite Check

```bash
{{test_command}}
# All tests must pass — not just the new one
```

---

## Anti-Patterns

| Anti-pattern | Why wrong |
|---|---|
| Write implementation first | Tests become implementation-shaped |
| Comment out failing tests | Red tests are signals, not noise |
| Test implementation details | Test observable behavior only |
| Skip the refactor step | Tech debt accumulates fast |

---

## Output / Deliverables

- Test file with happy path + edge cases
- Implementation that passes all tests
- Clean code matching project conventions

---

## Quality Checklist

- [ ] Test ran RED before implementation was written
- [ ] `{{test_command}}` passes (GREEN) after implementation
- [ ] Refactor complete — no duplication, no magic strings
- [ ] Full test suite still passes
- [ ] Task marked done: `agentic-skill task done <id>`
