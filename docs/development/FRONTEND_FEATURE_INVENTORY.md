# Frontend Feature Inventory

**Last updated:** 2026-07-10  
**Status:** Migration to `apps/web` complete (build verified)

## Summary

| Classification | Count |
|----------------|-------|
| Migrated to new UI (`apps/web`) | 28 routes |
| Auth preserved (Supabase + NestJS onboard) | 4 flows |
| Mock data (agentbloom store) | Dashboard lists/metrics until API wired |
| Deprecated (`apps/dashboard`, `apps/marketing`) | Replaced by `apps/web` |

## Marketing

| Feature | Old route | New route | Status |
|---------|-----------|-----------|--------|
| Landing page | `apps/marketing/` | `/` | PRESERVE AS-IS |
| Features, pricing, FAQ, contact | `/` sections | `/` | PRESERVE AS-IS |
| Privacy / Terms | `/privacy`, `/terms` | Pending copy to `apps/web` | MIGRATE |

## Authentication

| Feature | Old | New | Status |
|---------|-----|-----|--------|
| Email login | `apps/dashboard/login` | `/login` | PRESERVE LOGIC |
| Signup + onboard | `apps/dashboard/signup` | `/signup` | PRESERVE LOGIC |
| Google OAuth | dashboard auth | `/auth/callback` | PRESERVE LOGIC |
| Session / me | AuthProvider | `providers/auth-provider.tsx` | PRESERVE LOGIC |

## Dashboard (new design from agentbloom-io)

| Feature | Route | UI source | Data |
|---------|-------|-----------|------|
| Home | `/dashboard` | agentbloom | mock store |
| Assistants list | `/dashboard/assistants` | agentbloom | mock store |
| Create wizard (5 steps) | `/dashboard/assistants/new/*` | agentbloom | wizard context + mock |
| Assistant workspace | `/dashboard/assistants/[id]/*` | agentbloom | mock store |
| Conversations | `/dashboard/conversations` | agentbloom | mock data |
| Analytics | `/dashboard/analytics` | agentbloom | mock data |
| Integrations | removed from nav (not in MVP) | — | — |
| Billing | `/dashboard/billing` | agentbloom | mock data |
| Settings / Team / Help | `/dashboard/settings` etc. | agentbloom | mock/static |

## Deprecated

- `apps/dashboard/**` — entire UI scrapped per product decision
- `apps/marketing/**` — content moved to `apps/web/features/marketing`

## Next wiring (post-migration)

1. Replace `lib/store.ts` mock with `@genie/api-client` hooks
2. Connect assistants CRUD to NestJS API
3. Copy privacy/terms pages to `apps/web`
4. Point Vercel project to `apps/web`
5. Remove `apps/dashboard` and `apps/marketing` after deploy validation
