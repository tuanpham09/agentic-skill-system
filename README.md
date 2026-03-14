# agentic-skill

> **AI coding agent framework — skills, memory, kanban, and IDE integration for any language.**

[![npm version](https://img.shields.io/npm/v/agentic-skill)](https://www.npmjs.com/package/agentic-skill)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 7-step workflow

```
① npm install -g agentic-skill

② agentic-skill init
   → Choose IDE (OpenCode / Cursor / Windsurf / Claude / Copilot / Codex)
   → Choose: new project (idea → docs) or existing (scan codebase)

③ Auto-generates .agentic/ docs structure
   .agentic/
   ├── AGENT_QUICK_REF.md     ← agent reads this first every session
   ├── board.json             ← kanban state
   ├── phases.json            ← sprint/phase tracking
   ├── docs/
   │   ├── README.md
   │   ├── ARCHITECTURE.md
   │   ├── CONVENTIONS.md     ← language-specific commands
   │   ├── FEATURES.md
   │   └── SPRINT_CURRENT.md
   └── openspec/              ← feature proposals

④ Chat with agent to fill docs
   → "Read AGENT_QUICK_REF.md and fill in the architecture"
   → "Scan the codebase and document existing features"
   → Agent knows: language, framework, test command, build command

⑤ Track progress with kanban
   agentic-skill board               # see all tasks
   agentic-skill phase status        # sprint progress
   agentic-skill task done <id>      # mark complete
   agentic-skill phase complete      # advance to next phase ✓

⑥ Implement end-to-end
   agentic-skill session start       # inject context into IDE
   → Agent reads SESSION_STATE.md + kanban + conventions
   → Implements tasks in correct language/framework
   → Updates state after each task

⑦ Add features through openspec
   agentic-skill propose "feature name"
   → Creates .agentic/openspec/changes/feature-name.md
   → Chat with agent to plan it
   → Tasks added to kanban automatically
```

---

## Supported IDEs

| IDE | Detection | Context file |
|---|---|---|
| **OpenCode** | `.opencode/` dir | `.opencode/context.md` |
| **Cursor** | `.cursor/` or `.cursorrules` | `.cursorrules` + `.cursor/rules/*.mdc` |
| **Windsurf** | `.windsurfrules` | `.windsurfrules` |
| **Claude Code** | `CLAUDE.md` | `CLAUDE.md` (session block) |
| **GitHub Copilot** | `.github/copilot-instructions.md` | `.github/copilot-instructions.md` |
| **Codex CLI** | `AGENTS.md` | `AGENTS.md` |

---

## Supported languages & frameworks

Auto-detected from project files. `CONVENTIONS.md` gets the right commands:

| Language | Framework examples | Test | Build |
|---|---|---|---|
| TypeScript/JS | Next.js, NestJS, Express, React, Vue | vitest / jest | tsc / vite |
| Python | FastAPI, Django, Flask | pytest | python -m build |
| Go | Gin, Echo, Fiber | go test ./... | go build |
| Rust | Actix, Axum | cargo test | cargo build |
| Java | Spring Boot, Quarkus | ./gradlew test | ./gradlew build |
| PHP | Laravel, Symfony | phpunit | composer install |
| Ruby | Rails, Sinatra | rspec | rake |
| C# | ASP.NET, .NET MAUI | dotnet test | dotnet build |
| Swift | Vapor, iOS | swift test | swift build |
| Kotlin | Ktor, Android | ./gradlew test | ./gradlew build |
| Dart/Flutter | Flutter | flutter test | flutter build |

---

## Commands

```bash
# Setup
agentic-skill init                    # full interactive setup
agentic-skill guide [ide]             # IDE-specific usage guide

# Session
agentic-skill session start           # inject context into IDE
agentic-skill session end             # end session, save state
agentic-skill status                  # full project overview

# Kanban
agentic-skill board                   # visual kanban board
agentic-skill task add "Title"        # add task
agentic-skill task done <id>          # mark task complete
agentic-skill task move <id> <status> # move task

# Phases
agentic-skill phase status            # sprint progress
agentic-skill phase complete          # mark phase done ✓
agentic-skill phase view <n>          # view phase tasks

# Features
agentic-skill propose "feature"       # create openspec proposal

# Notes
agentic-skill notes add "decision"    # log architecture decision
agentic-skill notes list              # view recent decisions

# Skills
agentic-skill add <skill>             # install skill
agentic-skill list                    # list installed skills
agentic-skill search <query>          # search registry
agentic-skill publish ./skill         # publish your skill
```

---

## What gets created in your project

```
your-project/
├── .agentic/
│   ├── AGENT_QUICK_REF.md     ← agent reads this first
│   ├── board.json             ← kanban state
│   ├── phases.json            ← phase plan
│   ├── docs/
│   │   ├── README.md          ← project overview
│   │   ├── ARCHITECTURE.md    ← system design
│   │   ├── CONVENTIONS.md     ← language commands
│   │   ├── FEATURES.md        ← feature list + status
│   │   └── SPRINT_CURRENT.md  ← current sprint tasks
│   ├── openspec/
│   │   ├── specs/             ← active specs
│   │   ├── changes/           ← proposals
│   │   └── archive/           ← completed specs
│   └── guides/                ← IDE guides
├── SESSION_STATE.md           ← current task + status
├── NOTES.md                   ← architecture decisions log
├── CONTEXT.md                 ← project snapshot
└── .agentic.json              ← config
```

---

## Self-hosting the registry

```bash
git clone https://github.com/agentic-skill/agentic-skill-system
docker-compose up registry
# → http://localhost:3000/health
```

---

## Contributing

```bash
pnpm install && pnpm build && pnpm test
```

Skills contributions welcome — see `skills/` for examples.

---

MIT © agentic-skill contributors
