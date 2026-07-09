# Multi-Tenancy

**Last Updated:** 2026-07-07

---

## Model

Genie uses **organization-based multi-tenancy** with optional workspace sub-tenancy (Phase 3+).

```text
Organization (tenant)
  ├── Members (users with roles)
  ├── Workspaces (future)
  │     ├── Assistants
  │     ├── Knowledge Bases
  │     └── Conversations
  └── Billing / Usage
```

---

## Tenant Keys

| Scope | Column | Required On |
|-------|--------|-------------|
| Organization | `organization_id` | All tenant-owned entities |
| Workspace | `workspace_id` | Workspace-scoped entities |

---

## Defense in Depth

| Layer | Mechanism |
|-------|-----------|
| Authentication | Supabase Auth JWT |
| Authorization | NestJS guards + RBAC checks |
| Data access | Repository queries filter by `organization_id` |
| Database | Foreign keys, unique constraints |
| Storage | Tenant-prefixed paths |
| Vector search | Tenant filters in every query |
| RLS (future) | PostgreSQL Row Level Security policies |

---

## Rules

1. **Never trust client-supplied `organization_id`** without verifying membership
2. **Every read/write** on tenant data must include organization filter
3. **Signed URLs** only generated after authorization check
4. **Vector queries** must filter by `organization_id` AND `knowledge_base_id`
5. **API keys** scoped to organization (future)
6. **Audit logs** include `organization_id` and `user_id`

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

---

## IDOR Prevention

- Use UUIDs for all primary keys
- Never expose sequential IDs
- Validate resource belongs to authorized organization before any operation
- Return 404 (not 403) when resource exists but user lacks access (optional policy)

---

## Required Tests

For every tenant-scoped resource:

```text
USER_A (ORG_A) must NEVER access resources of USER_B (ORG_B)
```

Test matrix:
- Organizations
- Workspaces (future)
- Assistants (future)
- Knowledge bases (future)
- Documents (future)
- Storage files (future)
- Conversations (future)
- Vector search results (future)

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
