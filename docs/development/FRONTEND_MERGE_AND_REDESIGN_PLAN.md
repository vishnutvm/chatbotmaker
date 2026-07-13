# Frontend Merge and Redesign Plan

**Status:** Executed  
**Target:** Single Next.js app at `apps/web`  
**Design source:** [agentbloom-io](https://github.com/Online-pets-portal/agentbloom-io.git)

## Executive summary

Consolidated `apps/marketing` + `apps/dashboard` into **`apps/web`**. Replaced dashboard UI entirely with agentbloom-io design system. Preserved Supabase auth + NestJS onboard flows. Production build passes.

## Target architecture

```text
apps/web/
├── app/
│   ├── (marketing)/     # Public site
│   ├── (auth)/          # login, signup, callback
│   └── (dashboard)/     # SaaS app shell + routes
├── components/          # shadcn UI + shell + auth
├── features/
│   ├── marketing/
│   └── dashboard/pages/ # Ported agentbloom screens
├── lib/                 # auth, store, wizard, mock data
└── providers/
```

## Route map

| Area | Prefix |
|------|--------|
| Marketing | `/` |
| Auth | `/login`, `/signup`, `/auth/callback` |
| App | `/dashboard/**` |

## Migration strategy

1. Clone agentbloom-io reference UI
2. Scaffold `apps/web` with design tokens (`app/globals.css`)
3. Port TanStack routes → Next.js App Router via conversion script
4. Wire auth from former `apps/dashboard/lib`
5. Validate `pnpm --filter @genie/web build`

## Acceptance criteria

- [x] Single Next.js application
- [x] New dashboard design (agentbloom)
- [x] Marketing on same origin
- [x] Auth flows preserved
- [x] Production build passes
- [ ] E2E updated to `@genie/web` (in progress)
- [x] Vercel deploy config in `apps/web/vercel.json`
- [x] Remove deprecated `apps/dashboard`, `apps/marketing`

## Rollback

Revert to separate apps via git; Vercel projects for marketing/dashboard remain until cutover.
