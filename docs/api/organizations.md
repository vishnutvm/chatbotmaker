# Organizations API contract (Phase 3)

Product model: **companies (organizations) with team members**. Accounts may belong to multiple companies. Nested workspaces are out of scope.

Feature notes: [`docs/features/ORGANIZATIONS.md`](../features/ORGANIZATIONS.md).

Base path: `/api/v1` · Auth: `Authorization: Bearer <Supabase access token>` · Guard: `SupabaseJwtGuard`

---

## GET /organizations

- **Auth:** Bearer JWT (onboarded app user)
- **Response 200:** `{ "organizations": [{ id, name, slug, role, plan, createdAt }] }`
- Lists memberships for the caller (may be empty only in edge recovery cases)

## POST /organizations

- **Body:** `{ "name": string (1–100) }`
- **Response 201:** organization detail (`id`, `name`, `slug`, `role: "owner"`, `plan`, `ownerId`, `createdAt`, `updatedAt`)
- Creates a new company + owner membership (multi-company allowed)

## GET /organizations/:organizationId

- Membership required (`403` if not a member; `404` if org missing)
- **Response 200:** detail including `ownerId`, `updatedAt`, caller `role`

## PATCH /organizations/:organizationId

- **Auth:** owner or admin
- **Body:** `{ "name"?: string (1–100) }` — service requires a non-empty trimmed name
- **Response 200:** updated detail

---

## Members

### GET /organizations/:organizationId/members

- Membership required
- **Response 200:** `{ "members": [{ userId, email, name, role, createdAt }] }`

### POST /organizations/:organizationId/members

Invite teammate (owner/admin only).

- **Body:** `{ "email": string, "role"?: "admin" | "member" }` (default `member`; `owner` not allowed)
- **Response 200:**
  - Existing onboarded user: `{ "status": "added", "member": { userId, email, name, role, createdAt } }`
  - Unknown email: `{ "status": "invited", "invitation": { id, organizationId, email, role, status, expiresAt, createdAt, inviteUrl } }`
- **Conflicts 409:** already a member; pending invite for same email
- Pending invite matching that email is marked `accepted` when the user is added directly
- Invite TTL: **7 days**; `inviteUrl` = `{WEB_APP_URL|APP_WEB_URL|CORS origin}/invite/{token}`

### PATCH /organizations/:organizationId/members/:userId

- Owner/admin; cannot change a member who currently has role `owner`
- **Body:** `{ "role": "admin" | "member" }`
- **Response 200:** member DTO

### DELETE /organizations/:organizationId/members/:userId

- Owner/admin **or** self-leave
- Cannot remove the sole owner (`403`)
- **Response 204**

---

## Invitations

### GET /organizations/:organizationId/invitations

- Owner/admin — **pending** invites only
- **Response 200:** `{ "invitations": [ OrganizationInvitationDto ] }` (includes `inviteUrl`)

### DELETE /organizations/:organizationId/invitations/:invitationId

- Owner/admin — sets status `revoked` (`404` if not pending for this org)
- **Response 204**

### POST /organizations/invitations/accept

- **Body:** `{ "token": string (16–128) }`
- Authenticated user’s email must match invitation email (`403` otherwise)
- Pending + not expired; expired invites are marked `expired` then `400`
- Creates membership (or no-ops if already a member) and marks invite `accepted`
- **Response 200:** `OrganizationMemberDto`
- Invalid/non-pending token → `404`

---

## Security

- Tenant isolation via membership checks; never trust client org id alone
- Manager roles: `owner` | `admin` for invites, revoke, role changes, rename
- Opaque invite tokens (`randomBytes(32).toString('hex')`); do not log tokens

## Performance

- List members / invites: indexed by `organization_id` (+ status for invites)
- p95 target: &lt; 300ms for list/get paths
