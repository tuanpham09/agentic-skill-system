---
name: deploy-checklist
description: >
  Pre-deploy verification checklist for npm publish and registry server deployment.
  Runs build, tests, security audit, bundle size, and smoke tests before any release.
  Triggers: "deploy", "release", "publish npm", "before release", "ship it".
---

# Deploy Checklist

> **Agent context:** Run this skill before any npm publish or registry server deployment. Every item must pass before proceeding. A failed deploy is far more costly than a delayed one. Log the release to NOTES.md when done.

---

> **Commands:** Get , ,  from 

## When to Use This Skill

- Before `npm publish packages/cli/`
- Before tagging a version with `git tag vX.Y.Z`
- Before deploying the registry server to production
- Before any beta or RC release

---

## Step 1 — Clean Build

```bash
# Clean all build artifacts and rebuild from scratch:
{{install_command}}
{{build_command}}

# Expected: exit 0, zero TypeScript errors
echo "✓ Build clean: $?"
```

---

## Step 2 — Full Test Suite

```bash
{{test_command}}

# Expected: all tests pass, 0 failures
# If any fail: fix before proceeding — no exceptions
echo "✓ Tests: $?"
```

---

## Step 3 — Type Check

```bash
{{lint_command}}

# Expected: 0 errors across all packages
echo "✓ Typecheck: $?"
```

---

## Step 4 — Security Audit

```bash
(security audit tool for this language) --audit-level=moderate

# Expected: 0 high or critical vulnerabilities
# Moderate: review each one, document acceptance in NOTES.md if skipping
echo "✓ Security audit: $?"
```

---

## Step 5 — Skill Validation

```bash
node packages/cli/dist/index.js skill validate-all

# Expected: "✓ All 16 skills valid"
echo "✓ Skills valid: $?"
```

---

## Step 6 — Bundle Size Check

```bash
(package/build command for this project) --dry-run 2>&1 | grep -E "unpacked size|total files"

# Expected: unpacked size < 5MB
# If over: run perf-checker skill before proceeding
```

---

## Step 7 — Smoke Test (npm pack + local install)

```bash
# Pack the package
(package/build command for this project) --pack-destination /tmp/

# Install from pack in a temp directory
PACK_FILE=$(ls /tmp/agentic-skill-*.tgz | tail -1)
mkdir -p /tmp/smoke-test-$(date +%s)
cd /tmp/smoke-test-$(date +%s)
npm install -g "$PACK_FILE"

# Run smoke tests
agentic-skill --version
# → 1.x.x  ✓

agentic-skill --help
# → Shows commands ✓

agentic-skill init --yes --ide opencode
# → Creates .agentic.json ✓

agentic-skill add tdd-pipeline
# → Installs from bundled ✓

agentic-skill list
# → Shows tdd-pipeline ✓

echo "✓ Smoke tests passed"
```

---

## Step 8 — Version Bump

```bash
# Ensure version in packages/cli/package.json is correct
cat packages/cli/package.json | grep '"version"'

# Version must follow semver and be higher than current npm version:
npm view agentic-skill version
# Confirm new version > published version
```

---

## Step 9 — Changelog Entry

Add an entry to `CHANGELOG.md`:

```markdown
## [1.0.0] — 2025-03-14

### Added
- 16 bundled skills
- OpenCode, Claude Code, GitHub Copilot, Codex CLI adapters
- Skill registry server (self-hostable)
- `agentic-skill init/add/list/session/publish/search` commands

### Fixed
- N/A (first release)
```

---

## Step 10 — Tag and Publish

```bash
# Only run after ALL previous steps pass:

# Commit version bump
git add -A
git commit -m "chore: release v1.0.0"

# Tag
git tag v1.0.0
git push origin main --tags

# Publish to npm (CI will pick this up automatically via publish.yml)
# Or manually:
# npm publish packages/cli/ --access public

echo "✓ Released v1.0.0"
```

---

## Step 11 — Log the Release

```bash
agentic-skill notes add "Released v1.0.0 to npm — all 16 skills bundled, 4 IDE adapters, registry live"
```

---

## Output / Deliverables

- npm package published at correct version
- Git tag pushed
- CHANGELOG.md updated
- Release logged to NOTES.md

---

## Quality Checklist

- [ ] `pnpm clean && {{build_command}}` — exit 0, zero errors
- [ ] `{{test_command}}` — all passing
- [ ] `{{lint_command}}` — 0 errors
- [ ] `(security audit tool for this language)` — no high/critical vulnerabilities
- [ ] `skill validate-all` — all 16 skills valid
- [ ] Bundle unpacked size < 5MB
- [ ] Smoke test: init + add + list all work from fresh install
- [ ] Version in `package.json` is higher than published version
- [ ] CHANGELOG.md entry added
- [ ] Git tag pushed
- [ ] Release logged to NOTES.md
