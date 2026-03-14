# Project Context Snapshot

> Auto-generated snapshot. Run `agentic-skill context build` to refresh.
> Generated: 2025-03-15

---

## Project

- **Name:** agentic-skill-system
- **IDE:** opencode
- **Phase:** Sprint 1 complete → Sprint 2 next

---

## Current Session State

- **Sprint:** Sprint 1
- **Task:** All Sprint 1 files authored
- **Status:** in-progress (ready for `pnpm install && pnpm build`)
- **Last updated:** 2025-03-15

---

## Package Map

| Package | Published as | Role |
|---|---|---|
| `packages/cli` | `agentic-skill` (npm binary) | User-facing commands |
| `packages/core` | `@agentic-skill/core` | Skill engine, state, config, registry client |
| `packages/adapters` | `@agentic-skill/adapters` | OpenCode, Claude, Copilot, Codex |
| `packages/registry` | `@agentic-skill/registry` | Express API server + SQLite |

---

## Installed Skills (10)

- **session-state-manager** `1.0.0` [bundled] — Read and write SESSION_STATE.md
- **notes-manager** `1.0.0` [bundled] — Append decisions to NOTES.md
- **context-builder** `1.0.0` [bundled] — Build CONTEXT.md project snapshot
- **tdd-pipeline** `1.0.0` [bundled] — Red-green-refactor TDD workflow
- **sprint-executor** `1.0.0` [bundled] — Execute sprint tasks step by step
- **doc-reviewer** `1.0.0` [bundled] — Review docs for consistency
- **code-reviewer** `1.0.0` [bundled] — Review code against patterns
- **security-reviewer** `1.0.0` [bundled] — Check for security vulnerabilities
- **perf-checker** `1.0.0` [bundled] — Check startup time and bundle size
- **deploy-checklist** `1.0.0` [bundled] — Pre-release verification

---

## Key File Locations

| What | Where |
|---|---|
| CLI entry point | `packages/cli/src/index.ts` |
| All commands | `packages/cli/src/commands/` |
| Core types | `packages/core/src/types/index.ts` |
| Skill validator | `packages/core/src/skill-engine/validator.ts` |
| Session manager | `packages/core/src/state-manager/session.ts` |
| OpenCode adapter | `packages/adapters/src/opencode/index.ts` |
| Registry app | `packages/registry/src/app.ts` |
| DB schema | `packages/registry/src/db/schema.ts` |
| All 16 skills | `skills/*/` |
| Architecture docs | `docs/` |
| Sprint files | `sprints/SPRINT_0N.md` |

---

## Recent Notes & Decisions

**[2025-03-15]** Adapter design: stateless context injection, file-based, no IPC.

**[2025-03-15]** SkillValidator returns all errors at once — matches linter UX.

**[2025-03-15]** Registry auth: SHA256 token hash (not JWT), 1-year expiry, row-level revocation.

**[2025-03-15]** Bundled skills as offline fallback — `add` command tries cache → registry → bundled.
