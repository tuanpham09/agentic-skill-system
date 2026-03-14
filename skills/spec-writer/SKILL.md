---
name: spec-writer
description: >
  Write detailed technical spec files for modules, APIs, or features. Produces
  agent-readable specs that serve as the single source of truth during implementation.
  Triggers: "write spec", "create spec", "document this module", "spec for X".
---

# Spec Writer

> **Agent context:** Use this skill to write a technical spec before implementing a significant new module, API, or system change. The spec is the contract — implementation follows it, not the other way around. Write specs in `specs/` and cross-reference them from sprint tasks.

---

## When to Use This Skill

- Before implementing a new package or module (e.g. the registry server)
- When designing a new CLI command with complex behavior
- When defining a data schema or API contract
- When multiple agents or sessions will work on the same component

---

## Step 1 — Choose the Right Spec Type

| What you're speccing | Template to use |
|---|---|
| REST API | API Spec template |
| CLI command | Command Spec template |
| Module / class | Module Spec template |
| Database schema | Schema Spec template |

---

## Step 2 — Write the Spec File

Create `specs/{component-name}.md`:

### API Spec Template

```markdown
---
title: "Registry REST API"
type: api
status: active
version: "1.0"
---

# Registry REST API Spec

> **Agent context:** This is the authoritative API contract. Implement routes to
> match this spec exactly. Never add undocumented endpoints.

## Base URL

`https://registry.agentic-skill.dev/api/v1`

## Endpoints

### POST /skills

Publish a skill to the registry.

**Auth:** Required (Bearer token)
**Content-Type:** multipart/form-data

**Request:**
| Field | Type | Required | Description |
|---|---|---|---|
| bundle | File (.zip) | ✅ | Skill bundle (SKILL.md + skill.json + templates/) |

**Response 201:**
```json
{ "name": "tdd-pipeline", "version": "1.0.0", "url": "..." }
```

**Response 400:**
```json
{ "error": "SKILL.md missing Agent context block", "code": "VALIDATION_FAILED" }
```
```

### Module Spec Template

```markdown
---
title: "SkillValidator Module"
type: module
status: active
package: "@agentic-skill/core"
---

# SkillValidator Module Spec

> **Agent context:** This spec defines the SkillValidator class contract.
> Follow this when implementing or modifying the validator.

## Responsibility

Validates a skill directory against the canonical schema.
Returns all errors at once (never throws). Stateless — safe to reuse.

## Interface

```typescript
class SkillValidator {
  validate(skillDir: string): ValidationResult
  validateMany(skillDirs: string[]): Map<string, ValidationResult>
}

type ValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] }
```

## Validation Rules

1. `skill.json` must exist and parse as valid JSON
2. `skill.json` fields must match `skillMetaSchema` (Zod)
3. `SKILL.md` must exist
4. `SKILL.md` must start with YAML frontmatter (`---`)
5. `SKILL.md` must contain `> **Agent context:**` block
6. `SKILL.md` must have at least one H1 (`#`) and one H2 (`##`)
7. `SKILL.md` must have `## Quality Checklist` section

## Edge Cases

- Non-existent directory → error: "Directory not found"
- Corrupt skill.json → error: "skill.json is not valid JSON"
- Empty SKILL.md → fails rules 4-7
```

---

## Step 3 — Link Spec from Sprint

In the sprint file task, add a reference:

```markdown
### Task 2.1 — Registry Routes: GET /skills

**Ref:** `specs/REGISTRY_API.md`, `api/API_REFERENCE.md`
```

---

## Step 4 — Archive When Done

When the feature is fully implemented and tested:

```bash
mv specs/registry-api.md specs/archive/registry-api-v1.md
```

Update frontmatter: `status: archived`, `archivedAt: 2025-03-14`

---

## Output / Deliverables

- `specs/{component}.md` with complete technical specification

---

## Quality Checklist

- [ ] Spec file in `specs/` with YAML frontmatter
- [ ] `> **Agent context:**` block at top
- [ ] All public interfaces defined with TypeScript types
- [ ] All API endpoints have request + response examples
- [ ] Edge cases and error conditions documented
- [ ] Sprint task references this spec file in `Ref:` line
