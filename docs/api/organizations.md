# Organizations API contract (Phase 3)

Product model: **one account ↔ one company**. No member invite / team APIs.

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
- **Errors:** 400, 401, **409** if the account already has a company
- **Rule:** at most one company per account (onboard normally creates the first)

## GET /api/v1/organizations/:organizationId

- **Auth:** owner membership of org
- **Response 200:** `{ id, name, slug, plan, role, ownerId, createdAt, updatedAt }`
- **Errors:** 401, 403, 404

## PATCH /api/v1/organizations/:organizationId

- **Auth:** owner
- **Body:** `{ "name"?: string (1-100) }`
- **Response 200:** updated organization (caller role included)
- **Errors:** 400, 401, 403, 404

## Security

- Tenant isolation: membership check on every org-scoped route; never trust client org id alone
- Sole-owner product: member invite endpoints are not exposed

## Performance

- List orgs: 1 query with include
- p95 target: < 300ms
