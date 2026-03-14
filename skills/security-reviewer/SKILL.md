---
name: security-reviewer
description: >
  Review code for common security vulnerabilities: injection, auth bypass, path traversal,
  secret exposure, and unsafe deserialization. Use before any release or when adding
  auth/file/network code. Triggers: "security review", "check security", "audit code".
---

# Security Reviewer

> **Agent context:** Run this skill before any release and whenever you add authentication, file operations, network calls, or user input handling. Focus on the 8 vulnerability classes below. Log findings to NOTES.md.

---

## When to Use This Skill

- Before any npm publish or version tag
- After adding a new API route or CLI command that accepts user input
- When implementing auth (tokens, passwords, sessions)
- When touching file system operations with user-supplied paths
- After adding any new dependency

---

## Step 1 — Secret Exposure Scan

**Never hardcode secrets. Never log them.**

```bash
# Scan for potential hardcoded secrets:
grep -rn "password\|secret\|api_key\|apikey\|token\|private_key" \
  packages/*/src --include="*.ts" \
  | grep -v "\.test\.ts" \
  | grep -v "//.*" \
  | grep -v "type\|interface\|schema\|placeholder\|example\|test"

# Scan for secrets accidentally logged:
grep -rn "logger\.\|console\." packages/*/src --include="*.ts" \
  | grep -i "token\|password\|secret\|key"
```

**Fix pattern:**
```typescript
// ❌ Never
const token = 'agt_hardcoded_abc123';
logger.info(`Auth token: ${token}`);

// ✅ Always
const token = process.env['AGENTIC_TOKEN'];
if (!token) throw new AuthError('AGENTIC_TOKEN env var required');
logger.info('Auth token loaded from environment');
```

---

## Step 2 — Path Traversal Check

Any time user input is used in a file path, validate it.

```bash
# Find all file path constructions using user input:
grep -rn "join\|resolve\|readFile\|writeFile\|existsSync" \
  packages/*/src --include="*.ts" \
  | grep -v "\.test\."
```

**Fix pattern:**
```typescript
// ❌ Vulnerable
const skillDir = join(baseDir, userInput);

// ✅ Safe — validate stays within allowed base
import { resolve } from 'path';

function safeResolve(base: string, userPath: string): string {
  const resolved = resolve(base, userPath);
  if (!resolved.startsWith(resolve(base))) {
    throw new Error(`Path traversal detected: ${userPath}`);
  }
  return resolved;
}
```

---

## Step 3 — Input Validation (Registry Routes + CLI Args)

Every external input must be validated with Zod before use.

```bash
# Find route handlers without input validation:
grep -rn "req\.body\|req\.params\|req\.query" \
  packages/registry/src --include="*.ts"
```

**Fix pattern:**
```typescript
// ❌ No validation
app.post('/api/v1/skills', (req, res) => {
  const { name } = req.body;
  // name could be anything
});

// ✅ Zod validation
const publishSchema = z.object({
  name: z.string().regex(/^[a-z][a-z0-9-]*$/),
  version: z.string().regex(/^\d+\.\d+\.\d+/),
});

app.post('/api/v1/skills', (req, res) => {
  const result = publishSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Validation failed', code: 'VALIDATION_FAILED' });
  }
});
```

---

## Step 4 — Auth Check on Protected Routes

Every registry route that modifies data must require authentication.

```bash
# List all POST/PUT/DELETE routes:
grep -rn "app\.\(post\|put\|delete\|patch\)" \
  packages/registry/src --include="*.ts"
```

Verify each one passes through `authMiddleware`. No exceptions.

---

## Step 5 — Dependency Audit

```bash
# Check for known vulnerabilities:
(security audit tool for this language) --audit-level=moderate

# Check for suspicious new dependencies:
git diff HEAD~1 -- "**/package.json" | grep "^\+" | grep -v "version"
```

Flag any dependency that:
- Has no clear npm page or GitHub repo
- Was added as a transitive dep and is now direct
- Has `>=` or `*` as version specifier

---

## Step 6 — Token Storage Safety

Tokens are stored in `~/.agentic-skills/config.json`. Verify:

```bash
# File must have restrictive permissions:
ls -la ~/.agentic-skills/config.json
# Should be: -rw------- (600), owned by current user

# After CLI writes the file, set permissions:
```

```typescript
// In ConfigLoader.writeGlobal():
import { chmodSync } from 'fs';
writeFileSync(path, content, 'utf-8');
chmodSync(path, 0o600);  // Owner read/write only
```

---

## Output / Deliverables

- Security findings logged to `NOTES.md`
- Code fixes for any high/medium findings
- Summary: N issues found, N fixed, N accepted risks

---

## Quality Checklist

- [ ] No hardcoded secrets in source code (`grep` scan clean)
- [ ] No secrets logged at any log level
- [ ] All user-supplied paths validated against traversal
- [ ] All external inputs validated with Zod schemas
- [ ] All mutating registry routes require auth middleware
- [ ] `(security audit tool for this language)` shows no high/critical vulnerabilities
- [ ] Token storage file has permissions 600
- [ ] Security findings documented in NOTES.md
