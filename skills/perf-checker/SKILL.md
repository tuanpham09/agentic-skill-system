---
name: perf-checker
description: >
  Identify performance bottlenecks: slow CLI startup, blocking I/O, N+1 registry calls,
  and oversized npm bundles. Use before releases and when CLI feels slow.
  Triggers: "performance check", "slow startup", "optimize", "bundle size".
---

# Performance Checker

> **Agent context:** Run this skill before any release and whenever startup time or bundle size regresses. The CLI must start in under 200ms. The npm package must stay under 5MB unpacked. Log findings to NOTES.md.

---

## When to Use This Skill

- Before tagging a new release version
- When `agentic-skill --version` takes longer than 1 second
- When `npm pack` produces a package over 5MB
- After adding a new dependency to the CLI package
- When adding multiple registry calls in a single command

---

## Step 1 — CLI Startup Time

```bash
# Measure cold startup:
time node packages/cli/dist/index.js --version

# Target: < 200ms
# Warning: > 500ms
# Critical: > 1000ms
```

Common causes of slow startup:
- Top-level `await` in entry point
- Synchronous `require` of large modules
- Reading files at module load time (not at command execution time)

**Fix pattern — lazy imports:**
```typescript
// ❌ Slow: always loads the registry client even for offline commands
import { RegistryClient } from '@agentic-skill/core';

// ✅ Fast: only loads when the add/search/publish command is actually used
export async function addCommand(...) {
  const { RegistryClient } = await import('@agentic-skill/core');
  // ...
}
```

---

## Step 2 — Bundle Size

```bash
# Check packed size:
(package/build command for this project) --dry-run 2>&1 | tail -5
# Look for "unpacked size" — target: < 5MB

# Check what's large:
(package/build command for this project) --dry-run 2>&1 | grep -E "^\d" | sort -rh | head -20
```

**Reduce bundle size:**
```bash
# Check if bundled skills are too large:
du -sh skills/*/
# Each skill should be < 50KB

# Check for accidentally bundled node_modules:
ls packages/cli/dist/
# Should only contain index.js and index.d.ts
```

---

## Step 3 — File I/O Audit

```bash
# Find synchronous fs calls that block the event loop:
grep -rn "readFileSync\|writeFileSync\|existsSync" \
  packages/cli/src --include="*.ts"
```

Synchronous fs is acceptable in CLI commands (they're sequential anyway), but flag any sync calls inside:
- Module initialization (runs at startup)
- Loops over many files

**Fix pattern — batch reads:**
```typescript
// ❌ N file reads in a loop:
for (const skill of skills) {
  const meta = JSON.parse(readFileSync(join(skillsDir, skill, 'skill.json'), 'utf-8'));
}

// ✅ Parallel reads:
const metas = await Promise.all(
  skills.map(skill =>
    import('fs/promises').then(fs =>
      fs.readFile(join(skillsDir, skill, 'skill.json'), 'utf-8').then(JSON.parse)
    )
  )
);
```

---

## Step 4 — Registry Call Batching

Every command should make the **minimum** number of registry calls:

```bash
# Add verbose logging temporarily:
AGENTIC_LOG_LEVEL=debug node packages/cli/dist/index.js session start 2>&1 | grep "registry"
```

Rules:
- `session start` → 0 registry calls (reads local files only)
- `add <skill>` → max 1 registry call (resolve + download)
- `update --check` → 1 registry call (list with installed names filter)

---

## Step 5 — Memory Usage

```bash
# Check peak memory for common commands:
node --expose-gc -e "
  const before = process.memoryUsage().heapUsed;
  require('./packages/cli/dist/index.js');
  global.gc();
  const after = process.memoryUsage().heapUsed;
  console.log('Heap delta:', Math.round((after - before) / 1024), 'KB');
"
```

Target: < 30MB heap for any single command.

---

## Output / Deliverables

- Performance measurements logged to `NOTES.md`
- Fixes for any startup > 500ms or bundle > 5MB
- Summary table: metric | before | after | target

---

## Quality Checklist

- [ ] `time node cli/dist/index.js --version` — under 200ms
- [ ] `npm pack --dry-run` unpacked size under 5MB
- [ ] No synchronous fs calls in module initialization code
- [ ] Registry calls per command match spec (session start = 0)
- [ ] No accidental `node_modules` in dist output
- [ ] Performance findings logged to NOTES.md
