# Architecture Notes

> Auto-managed by agentic-skill CLI. Append only — never delete entries.

---

## [2025-03-15 00:00] Project bootstrapped — initial architecture decisions

**Stack:** TypeScript + Node.js 20, pnpm monorepo (4 packages: cli, core, adapters, registry).

**Key decision:** `@agentic-skill/core` has zero internal dependencies — it is the foundation layer. All other packages depend on it, not vice versa.

**Key decision:** Skills stored in two places — global (`~/.agentic-skills/skills/{name}@{version}/`) and local (`.skills/{name}/`). Local always wins in resolution.

**Key decision:** OpenCode is the priority IDE adapter. Detection priority: OpenCode → Claude → Copilot → Codex.

**Key decision:** Registry uses SQLite + Drizzle ORM for MVP. Self-hostable with Docker in one command.

**Key decision:** CLI published as `agentic-skill` on npm. All 16 skills bundled so offline use works out of the box.

**Key decision:** `session start` injects context by writing to IDE-specific markdown file. Works regardless of how the IDE starts the AI. No IPC, no API, no daemon needed.

---

## [2025-03-15 00:01] Adapter design — stateless context injection

Each IDE adapter is stateless. `injectContext()` takes the full `AgentContext` and writes to the IDE file. No persistent connection, no process watching. This means:
- Zero runtime overhead when not in session
- Works with any IDE version (file-based, not API-based)
- Easy to test (no mocking)

Claude adapter appends a session block inside HTML comments (`<!-- AGENTIC-SKILL:SESSION:START -->`) so it doesn't destroy existing CLAUDE.md content.

---

## [2025-03-15 00:02] Skill validation — return all errors at once

`SkillValidator.validate()` always returns `ValidationResult` — never throws. It collects ALL errors before returning, so authors see the full list of issues at once rather than fixing one at a time.

This matches the UX pattern of linters and compilers.

---

## [2025-03-15 00:03] Bundled skills as offline fallback

All 16 skills are included in the npm package under `skills/`. The `add` command tries: cache → registry → bundled. This means:
- `AGENTIC_OFFLINE=true` forces bundled use
- Network failures fall back to bundled automatically
- Fresh installs work without internet

---

## [2025-03-15 00:04] Registry auth — SHA256 token hash, no JWT

Tokens are stored as SHA256 hashes in the DB, never the raw token. This means if the DB is compromised, tokens are not exposed. JWT was considered but rejected — tokens are opaque strings (prefix `agt_`), simpler to implement, easier to revoke (just delete the row).

Token expiry: 1 year by default. No refresh token needed for v1.0.
