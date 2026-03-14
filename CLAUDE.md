# Agentic Skill System — Project Rules

> This file is read by Claude Code at the start of every session.
> Always read `AGENT_QUICK_REF.md` first, then this file.

---

## Critical Rules (Never Violate)

1. **No business logic in CLI command handlers** — commands parse input and call core modules only
2. **No raw `fs` calls in commands** — always use `StateManager`, `SkillLoader`, `SkillInstaller`
3. **No `console.log` in production code** — all output via `logger.info/success/warn/error/hint`
4. **No `any` type, no `@ts-ignore`** — TypeScript strict mode is non-negotiable
5. **Adapters must be stateless** — no mutable instance state in IDE adapters
6. **`@agentic-skill/core` has zero internal deps** — it is the foundation layer
7. **All registry routes match `api/API_REFERENCE.md` exactly** — no undocumented endpoints
8. **Update `SESSION_STATE.md` after every completed task** — this is how sessions resume
9. **Every new skill must have `> **Agent context:**` block** — validator will reject without it
10. **Skill names are kebab-case** — `tdd-pipeline` not `TDDPipeline`

---

## Workflow

```
1. agentic-skill status              — check current state
2. Read sprints/SPRINT_0N.md         — understand current tasks
3. Read architecture/DESIGN_PATTERNS.md — use correct patterns
4. Implement (TDD: test first)
5. pnpm test && pnpm typecheck        — must pass
6. agentic-skill session update ...   — update state
7. agentic-skill notes add "..."      — log decisions
```

---

## Patterns Quick Reference

| Code type | Pattern to use |
|---|---|
| CLI command | Command Handler (Pattern 1) |
| IDE integration | IDE Adapter (Pattern 2) |
| Skill validation | Skill Validator (Pattern 3) |
| State file ops | State Manager (Pattern 4) |
| Registry calls | Registry Client (Pattern 5) |

**Full patterns:** `architecture/DESIGN_PATTERNS.md`

---

## Naming

- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Interfaces: `I` + PascalCase
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Env vars: `AGENTIC_` prefix
- Skill names: `kebab-case`

---

## Package Boundaries

```
cli → depends on: core, adapters
adapters → depends on: core
core → depends on: nothing internal
registry → standalone server
```

Never import `cli` or `adapters` from `core`.
