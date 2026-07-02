---
name: new-api-endpoint
description: Playbook for adding a new REST API endpoint in the NestJS backend. Use when creating or modifying API routes, DTOs, guards, or controller actions.
---

# New API Endpoint Playbook

## Steps

### 1. Define contract

```markdown
Method: GET | POST | PUT | PATCH | DELETE
Path: /api/v1/...
Auth: required | public
Request body/query:
Response:
Errors: 400, 401, 403, 404, 429
```

### 2. Create DTOs

- `create-<resource>.dto.ts` with class-validator decorators
- `update-<resource>.dto.ts` (partial)
- Response DTO or entity mapper

### 3. Controller (thin)

```typescript
@Post()
@UseGuards(JwtAuthGuard)
create(@Body() dto: CreateDto, @CurrentUser() user: User) {
  return this.service.create(dto, user);
}
```

### 4. Service

- Permission check
- Business logic
- Call repository

### 5. Repository

- Data access only
- Parameterized queries
- Pagination for lists

### 6. Tests

- Unit: service logic + validation edge cases
- Integration: HTTP request → response with test DB

### 7. Security

- Rate limit if public or expensive
- Validate file uploads if applicable
- Run `security-engineer` review for sensitive endpoints

## Checklist

- [ ] DTO validation with reject-unknown-fields
- [ ] Auth guard on protected routes
- [ ] Permission check in service
- [ ] Consistent error response shape
- [ ] API documented
- [ ] Tests passing
