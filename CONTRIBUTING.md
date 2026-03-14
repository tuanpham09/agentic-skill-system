# Contributing to agentic-skill

## First-time setup

```bash
git clone https://github.com/YOUR_USERNAME/agentic-skill-system.git
cd agentic-skill-system

# 1. Install pnpm (required — do NOT use npm/yarn for this repo)
npm install -g pnpm@9

# 2. Install all dependencies AND generate pnpm-lock.yaml
pnpm install

# 3. Build
pnpm build

# 4. Test
pnpm test

# 5. Link CLI locally
cd packages/cli && npm link && cd ../..
agentic-skill --version  # → 1.0.0
```

## IMPORTANT — pnpm-lock.yaml

This repo uses pnpm workspaces. The `pnpm-lock.yaml` file **must be committed**.

```bash
# After adding/changing dependencies:
pnpm install           # regenerates pnpm-lock.yaml
git add pnpm-lock.yaml
git commit -m "chore: update lockfile"
```

**Never delete or .gitignore the pnpm-lock.yaml** — CI will fail without it.

## Why CI fails with "Dependencies lock file is not found"

The `pnpm install --frozen-lockfile` flag requires `pnpm-lock.yaml` to exist
in the repo root. If you see this error:

1. Run `pnpm install` locally (generates the lockfile)
2. Commit `pnpm-lock.yaml`
3. Push — CI will pass

## Adding a dependency

```bash
# Add to a specific package
pnpm --filter @agentic-skill/core add zod
pnpm --filter agentic-skill add commander

# Add dev dependency to root
pnpm add -D -w vitest

# Always commit the updated lockfile:
git add pnpm-lock.yaml packages/*/package.json
```

## Before submitting a PR

```bash
pnpm build                                         # zero TS errors
pnpm test                                          # all tests pass
node packages/cli/dist/index.js skill validate-all # 16 skills valid
```
