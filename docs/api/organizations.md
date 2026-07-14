# Organizations API contract (Phase 3)

## GET /api/v1/organizations

- **Auth:** Bearer JWT (required)
- **Response 200:**
  ```json
  { "organizations": [{ "id", "name", "slug", "role", "plan", "createdAt" }] }
  ```
- **Errors:** 401

## POST /api/v1/organizations

- **Auth:** Bearer JWT (required)
- **Body:** `{ "name": string (1-100) }`
- **Response 201:** organization with role `owner`
- **Errors:** 400, 401

## GET /api/v1/organizations/:organizationId

- **Auth:** member of org
- **Response 200:** `{ id, name, slug, plan, role, ownerId, createdAt, updatedAt }`
- **Errors:** 401, 403, 404

## PATCH /api/v1/organizations/:organizationId

- **Auth:** owner or admin
- **Body:** `{ "name"?: string (1-100) }`
- **Response 200:** updated organization (caller role included)
- **Errors:** 400, 401, 403, 404

## GET /api/v1/organizations/:organizationId/members

- **Auth:** member
- **Response 200:**
  ```json
  { "members": [{ "userId", "email", "name", "role", "createdAt" }] }
  ```
- **Errors:** 401, 403, 404

## POST /api/v1/organizations/:organizationId/members

- **Auth:** owner or admin
- **Body:** `{ "email": string, "role"?: "admin"|"member" }` (default member)
- **Response 201:** member row
- **Errors:** 400, 401, 403, 404 (user not found), 409 (already member)

## PATCH /api/v1/organizations/:organizationId/members/:userId

- **Auth:** owner or admin
- **Body:** `{ "role": "admin"|"member" }` (cannot assign owner via this endpoint)
- **Errors:** 400, 401, 403, 404

## DELETE /api/v1/organizations/:organizationId/members/:userId

- **Auth:** owner or admin (or self-leave if not sole owner)
- **Response 204**
- **Errors:** 401, 403, 404

## Security

- Tenant isolation: membership check on every org-scoped route; never trust client org id alone for authorization beyond route param + membership lookup
- Roles enforced in service layer

## Performance

- List orgs: 1 query with include
- List members: 1 query with user select
- p95 target: < 300ms
