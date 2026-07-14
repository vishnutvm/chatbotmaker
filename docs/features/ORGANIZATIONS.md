# Organizations (Phase 3)

**Last Updated:** 2026-07-14  
**Status:** Shipped (Team + invitations restored)

---

## Product model

Genie tenants are **companies (organizations)**. Reality after Team restore (`8e81430`, `a6b37c7`):

| Concept | Behavior |
|---------|----------|
| Account | One Supabase Auth user → one Nest `users` row after onboard |
| Default company | Onboard always creates a company owned by the user (`{name}'s Company`) |
| Multi-company | A user may be a member of many organizations |
| Multi-member | A company may have many members (`owner` / `admin` / `member`) |
| Workspaces | **Not** implemented — nested workspaces remain future scope |

A brief mid-phase cut (`a5f0303`) removed Team/invite UI toward one-account-one-company. That direction was reversed; API + schema + dashboard Team surfaces are the source of truth.

---

## Backend

| Layer | Location |
|-------|----------|
| Module | `apps/api/src/modules/organizations/` |
| Types | `packages/types/src/organization.ts` |
| API client | `packages/api-client/src/organizations.ts` |
| Contract | [`docs/api/organizations.md`](../api/organizations.md) |
| Tenancy rules | [`docs/database/MULTI_TENANCY.md`](../database/MULTI_TENANCY.md) |

### Roles

- **owner** — created on org create / onboard; cannot be assigned via invite or role patch
- **admin** / **member** — inviteable; `owner` + `admin` are managers (invite, revoke, change roles, rename org)

### Invite path

1. `POST .../members` with `{ email, role? }`
2. If email matches an onboarded user → membership created (`status: "added"`)
3. Else → `organization_invitations` row + `inviteUrl` (`status: "invited"`, TTL **7 days**)
4. Accept: `POST /api/v1/organizations/invitations/accept` with `{ token }` — JWT email must match invite email

Invite links use `WEB_APP_URL` (or `APP_WEB_URL`, else first CORS origin) → `{origin}/invite/{token}`.

---

## Frontend

| Surface | Path | Notes |
|---------|------|-------|
| Org switcher | `apps/web/components/shell/Sidebar.tsx` | Lists memberships from `/auth/session`; persists `genie.activeOrgId` in `localStorage` |
| Team page | `/dashboard/team` → `features/dashboard/pages/team.tsx` | Members + pending invites; managers invite / revoke / remove / change role |
| Invite landing | `/invite/[token]` | Accepts when signed in; otherwise login/signup with `?invite=` |
| Auth handoff | `lib/auth-flow.ts` `routeAfterAuth` | After onboard, accepts invite then routes to `/dashboard/team` |

Auth context (`providers/auth-provider.tsx`) exposes `organizations`, `activeOrg`, `setActiveOrgId`. Active org is **client selection** for dashboard UX — server APIs still authorize by membership on the org id in the route.

---

## Security notes

- Never trust client `organizationId` without membership check (service `requireMembership`)
- Managers only for invites / revoke / role changes
- Cannot remove sole owner; cannot reassign `owner` via PATCH members
- Accept rejects mismatched invite email (`403`)

---

## Related docs

- API: `docs/api/organizations.md`
- Schema: `docs/database/DATABASE_DESIGN.md` (`organizations`, `organization_members`, `organization_invitations`)
- Auth onboard: `docs/architecture/AUTHENTICATION_ARCHITECTURE.md`
