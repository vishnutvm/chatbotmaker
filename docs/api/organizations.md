# Organizations API contract (Phase 3)

Product model: **companies (organizations) with team members**. Accounts may belong to multiple companies. Nested workspaces are out of scope.

## GET /api/v1/organizations

- **Auth:** Bearer JWT
- **Response 200:** `{ "organizations": [{ id, name, slug, role, plan, createdAt }] }`

## POST /api/v1/organizations

- **Body:** `{ "name": string (1-100) }`
- **Response 201:** organization detail with role `owner`
- Creates a new company owned by the caller (multi-company allowed)

## GET /api/v1/organizations/:organizationId

- Membership required
- **Response 200:** detail including `ownerId`, `updatedAt`

## PATCH /api/v1/organizations/:organizationId

- **Auth:** owner or admin
- **Body:** `{ "name"?: string }`

## Members

### GET /api/v1/organizations/:organizationId/members

- Membership required
- **Response 200:** `{ "members": [{ userId, email, name, role, createdAt }] }`

### POST /api/v1/organizations/:organizationId/members

Invite teammate (owner/admin).

- **Body:** `{ "email": string, "role"?: "admin" | "member" }`
- **Response 200:**
  - Existing onboarded user: `{ "status": "added", "member": { ... } }`
  - Unknown email: `{ "status": "invited", "invitation": { id, email, role, inviteUrl, expiresAt, ... } }`

### PATCH /api/v1/organizations/:organizationId/members/:userId

- Owner/admin; cannot change `owner` role
- **Body:** `{ "role": "admin" | "member" }`

### DELETE /api/v1/organizations/:organizationId/members/:userId

- Owner/admin (or self-leave). Cannot remove sole owner. **204**

## Invitations

### GET /api/v1/organizations/:organizationId/invitations

- Owner/admin — pending invites only

### DELETE /api/v1/organizations/:organizationId/invitations/:invitationId

- Owner/admin — revoke. **204**

### POST /api/v1/organizations/invitations/accept

- **Body:** `{ "token": string }`
- Authenticated user email must match invitation email
- Creates membership and marks invite accepted

Invite links: `{WEB_APP_URL|/CORS origin}/invite/{token}` (set `WEB_APP_URL` in API env for production).

## Security

- Tenant isolation via membership checks; never trust client org id alone
- Manager roles: `owner` | `admin` for invites and role changes

## Performance

- List members / invites: indexed by `organization_id`
- p95 target: < 300ms
