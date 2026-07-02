---
name: new-module
description: Playbook for creating a new NestJS feature module in apps/api. Use when adding a new domain module (e.g. organizations, assistants, billing) with controller, service, and repository.
---

# New Module Playbook

## Prerequisites

- [ ] Roadmap phase allows this module
- [ ] Architecture design approved (use `solution-architect` for non-trivial modules)
- [ ] Module boundary defined — no cross-contamination with auth/billing/analytics/AI

## Steps

### 1. Scaffold module

```text
apps/api/src/modules/<name>/
  <name>.module.ts
  <name>.controller.ts
  <name>.service.ts
  <name>.repository.ts
  dto/
  schemas/ or entities/
  __tests__/
```

### 2. Register module

- Import in `app.module.ts`
- Export service if other modules need it (prefer events over direct coupling)

### 3. Implement layers

| Layer | Responsibility |
|-------|----------------|
| Controller | DTO validation, auth guard, delegate to service |
| Service | Business logic, permission checks |
| Repository | MongoDB queries only |

### 4. Add shared types

- Add DTOs/types to `packages/types` if consumed by frontends

### 5. Tests

- Unit tests for service logic
- Integration tests for API endpoints

### 6. Documentation

- API docs for new endpoints
- Update module list in architecture docs if significant

## Checklist

- [ ] Thin controller
- [ ] No business logic in repository
- [ ] Permission checks in service
- [ ] Input validation on all endpoints
- [ ] Pagination on list endpoints
- [ ] Tests passing
- [ ] Docs updated
