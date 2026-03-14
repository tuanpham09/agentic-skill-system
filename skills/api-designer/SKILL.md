---
name: api-designer
description: >
  Design REST API endpoints: define routes, request/response schemas, auth requirements,
  and error codes. Use before implementing any new registry route or CLI-facing API.
  Triggers: "design API", "new endpoint", "API route", "REST endpoint".
---

# API Designer

> **Agent context:** Use this skill before implementing any new API endpoint. Design the full contract first — route, method, auth, request schema, response schemas, error codes. Then implement. The contract in `api/API_REFERENCE.md` is the source of truth.

---

## When to Use This Skill

- Adding a new route to the registry server
- Extending an existing endpoint with new parameters
- Designing a webhook or callback endpoint
- Any new network-facing interface

---

## Step 1 — Define the Endpoint Contract

For each new endpoint, specify:

```markdown
### `METHOD /path/:param`

**Description:** One sentence on what this does.
**Auth:** None | Bearer token required | API key
**Rate limit:** N requests/min (default: 60)

**Request:**
| Field | In | Type | Required | Description |
|---|---|---|---|---|
| name | path | string | ✅ | kebab-case skill name |
| version | path | string | ✅ | semver or "latest" |
| bundle | body | File (.zip) | ✅ | Skill bundle |

**Response 200/201:**
```json
{
  "name": "tdd-pipeline",
  "version": "1.0.0"
}
```

**Error Responses:**
| Status | Code | When |
|---|---|---|
| 400 | VALIDATION_FAILED | Invalid request body |
| 401 | AUTH_FAILED | Missing or invalid token |
| 404 | SKILL_NOT_FOUND | Skill/version doesn't exist |
| 409 | VERSION_EXISTS | Can't overwrite published version |
```

---

## Step 2 — Validate Against Existing Contracts

Check `api/API_REFERENCE.md`:
- No duplicate route paths
- Consistent error code names with existing codes
- Consistent response envelope format

```bash
grep "api/v1" api/API_REFERENCE.md | grep -o '"[A-Z_]*"' | sort -u
# These are the existing error codes — reuse them, don't invent new ones
```

---

## Step 3 — Add to API_REFERENCE.md

Add the new endpoint to the correct section in `api/API_REFERENCE.md` before writing any implementation code.

---

## Step 4 — Write Route Tests First

```typescript
// packages/registry/src/routes/skills.test.ts
it('GET /api/v1/skills/:name/latest returns 404 for unknown skill', async () => {
  const res = await request(app).get('/api/v1/skills/nonexistent/latest');
  expect(res.status).toBe(404);
  expect(res.body.code).toBe('SKILL_NOT_FOUND');
});
```

---

## Output / Deliverables

- Endpoint contract added to `api/API_REFERENCE.md`
- Route implementation matching the contract
- Tests for happy path and each error code

---

## Quality Checklist

- [ ] Endpoint added to `api/API_REFERENCE.md` before code
- [ ] All error responses use codes from the existing error code table
- [ ] Auth requirement explicitly stated
- [ ] Request validation uses Zod schema
- [ ] Tests cover happy path + each error status code
