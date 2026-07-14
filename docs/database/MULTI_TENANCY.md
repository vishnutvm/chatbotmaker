# Multi-Tenancy

**Last Updated:** 2026-07-14

---

## Model

Genie uses **organization-based multi-tenancy**. The tenant boundary is a company (`organizations`). Users attach via `organization_members` (and optionally pending `organization_invitations`). Nested **workspaces are not shipped** — keep them out of application paths until a later phase.

```text
Organization (tenant / company)
  ├── Members (users + roles: owner | admin | member)
  ├── Invitations (pending email invites)
  ├── Billing / Usage (future)
  └── Tenant-owned resources (assistants, knowledge, … — later phases)
```

**Product rules (Phase 3):**

- One account may belong to **many companies**
- One company may have **many members**
- Onboard provisions a default company owned by the user; Team invites add further members or memberships across companies

See [`docs/features/ORGANIZATIONS.md`](../features/ORGANIZATIONS.md).

---

## Tenant Keys

| Scope | Column | Required On |
|-------|--------|-------------|
| Organization | `organization_id` | All tenant-owned entities |
| Workspace | `workspace_id` | **Future** — do not add until workspaces ship |

---

## Schema (tenant core)

| Table | Role |
|-------|------|
| `organizations` | Tenant root (`id`, `slug`, `owner_id`, `plan`) |
| `organization_members` | User ↔ org + `role`; unique `(user_id, organization_id)` |
| `organization_invitations` | Pending invite by email + opaque `token`; status `pending` / `accepted` / `revoked` / `expired` |

Indexes of note: `organization_members(user_id)`, `organization_members(organization_id)`, `organization_invitations(organization_id, status)`, `organization_invitations(email)`.

---

## Defense in Depth

| Layer | Mechanism |
|-------|-----------|
| Authentication | Supabase Auth JWT |
| Authorization | NestJS guards + membership / RBAC in services |
| Data access | Repository queries filter by `organization_id` |
| Database | FKs, unique membership constraint |
| Storage | Tenant-prefixed paths (when Storage phase wires up) |
| Vector search | Tenant filters in every query (Knowledge phase) |
| RLS (future) | PostgreSQL Row Level Security — not relied on for MVP |

---

## Rules

1. **Never trust client-supplied `organization_id`** without verifying membership
2. **Every read/write** on tenant data must include an organization filter
3. **Signed URLs** only after authorization
4. **Vector queries** must filter by `organization_id` (and resource ids when present)
5. **API keys** scoped to organization (future)
6. **Audit logs** include `organization_id` and `user_id` (future)
7. **Invites:** accept only when JWT user email matches invitation email; managers only create/revoke

---

## Authorization Check Pattern

```typescript
// Service layer — always verify membership
async getAssistant(userId: string, organizationId: string, assistantId: string) {
  await this.authz.assertOrganizationMember(userId, organizationId);
  return this.assistantRepo.findById(organizationId, assistantId);
}
```

```typescript
// Repository layer — always filter by tenant
findById(organizationId: string, id: string) {
  return this.prisma.assistant.findFirst({
    where: { id, organizationId },
  });
}
```

Dashboard **active org** (`localStorage` `genie.activeOrgId`) is UI context only. APIs authorize the org id on each request via membership.

---

## IDOR Prevention

- Use UUIDs for all primary keys
- Never expose sequential IDs
- Validate resource belongs to authorized organization before any operation
- Prefer 404 when hiding existence is required; current org APIs use 403 when authenticated but not a member

---

## Required Tests

For every tenant-scoped resource:

```text
USER_A (ORG_A) must NEVER access resources of USER_B (ORG_B)
```

Test matrix:

- Organizations / members / invitations (Phase 3)
- Assistants, knowledge bases, documents, storage, conversations, vector results (later phases)

Cross-tenant membership checks belong in API integration / e2e suites as each resource ships.

---

## RLS Policy Strategy (Future)

When dashboard or widget accesses Supabase directly:

```sql
CREATE POLICY "org_isolation" ON documents
  FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ));
```

NestJS service role bypasses RLS; application-level checks remain mandatory.
