---
name: api-contract-first
description: Define API contract before implementing any REST endpoint. Use when adding or changing API routes to prevent frontend/backend mismatches.
---

# API Contract First

**Never implement an endpoint without a written contract.**

## Contract template

Save to `docs/api/` or feature plan before coding:

```yaml
endpoint: POST /api/v1/assistants
auth: Bearer JWT (required)
roles: [org:admin, org:member]

request:
  content-type: application/json
  body:
    name: string (required, 1-100)
    prompt: string (required)
    model: string (optional, default: gpt-4o-mini)
    temperature: number (optional, 0-2)

response:
  201:
    id: string
    name: string
    organizationId: string
    createdAt: ISO8601

errors:
  400: Validation failed — { errors: [{ field, message }] }
  401: Unauthorized
  403: Forbidden — insufficient role
  429: Rate limited

validation:
  - Reject unknown fields
  - Sanitize string inputs
  - Enforce org tenant scope on all queries

performance:
  p95_latency: < 300ms
  db_queries: <= 2

security:
  - Tenant isolation: organizationId from JWT only
  - Rate limit: 60 req/min per user
```

## Workflow

1. Write contract (this template)
2. Review with `tech-lead` and `solution-architect`
3. Add types to `packages/types`
4. Implement backend (`backend-engineer`)
5. Implement frontend against contract (`frontend-engineer`)
6. Integration tests assert contract shape

## Rules

- Contract is the source of truth for frontend and backend
- Breaking changes require version bump or migration plan
- Document in `docs/api/` when endpoint ships
