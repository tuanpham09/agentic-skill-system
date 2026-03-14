# Changelog

All notable changes to `agentic-skill` are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

---

## [Unreleased]

### In Progress
- Sprint 1: CLI core + OpenCode adapter
- Sprint 2: Registry server
- Sprint 3: All 16 skills authored
- Sprint 4: State management + spec engine
- Sprint 5: Polish + v1.0.0 release

---

## [1.0.0] — TBD

### Added
- `agentic-skill init` — initialize any project with state files and IDE config
- `agentic-skill add <skill>` — install skills from registry or local path
- `agentic-skill list` — list installed skills
- `agentic-skill session start/end/status/resume/update` — session management
- `agentic-skill status` — full project status dashboard
- `agentic-skill notes add/list` — append-only architecture decision log
- `agentic-skill search` — search the skill registry
- `agentic-skill publish` — publish skills to registry
- `agentic-skill login` — authenticate with registry
- `agentic-skill update` — update installed skills
- OpenCode IDE adapter (priority)
- Claude Code IDE adapter
- GitHub Copilot IDE adapter
- Codex CLI IDE adapter
- Auto-detection of IDE from project files
- 16 bundled official skills
- Skill registry server (Express + SQLite, Docker-ready)
- Skill validation (SkillValidator with full schema check)
- Global skill cache (`~/.agentic-skills/skills/`)
- Local skill override (`.skills/` in project root)
- Offline mode (`AGENTIC_OFFLINE=true`)
- CI/CD: GitHub Actions for test + publish
