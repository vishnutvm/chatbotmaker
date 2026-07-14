# Project Status — Supabase Migration

**Last Updated:** 2026-07-14

---

## MVP roadmap (Genie Phases)

| Phase | Focus | Exit notes |
|-------|--------|------------|
| 2 | Authentication | Shipped — Supabase Auth + Nest onboard / session |
| 3 | Organizations | **Shipped** — multi-company membership, Team UI, email invitations, org switcher. Docs: `docs/features/ORGANIZATIONS.md`, `docs/api/organizations.md`, `docs/database/MULTI_TENANCY.md` |
| 4+ | AI → Knowledge → … | Follows `Docs/05-mvp-roadmap.md`; do not nest workspaces until product scope reopens them |

Phase 3 exit (docs task closed): feature notes + API contract + tenancy model match restored Team commits (`8e81430`, `a6b37c7`). Cross-tenant isolation tests for future resources remain ongoing engineering debt (not blockers for Phase 3 org CRUD/invite).

---

## Current Migration Phase

**Phase 20:** Complete validation (in progress — local validation passed)

---

## Completed Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Repository analysis | ✅ |
| 2 | Migration plan | ✅ |
| 3 | ADR 0001 | ✅ |
| 4 | Architecture documentation | ✅ |
| 5 | Infrastructure documentation | ✅ |
| 6 | PostgreSQL database design | ✅ |
| 7 | Supabase configuration docs | ✅ |
| 8 | Database foundation (Prisma) | ✅ |
| 9 | Supabase Auth integration | ✅ |
| 10 | Multi-tenancy foundation | ✅ |
| 11 | Storage abstraction | ✅ |
| 12 | pgvector foundation | ✅ |
| 13 | RAG architecture docs | ✅ |
| 14 | Remove MongoDB dependencies | ✅ |
| 15 | Remove Redis MVP requirements (docs) | ✅ |
| 16 | Remove S3 MVP requirements (docs) | ✅ |
| 17 | Environment configuration | ✅ |
| 18 | Deployment configuration | ✅ |
| 19 | Update tests | ✅ |
| 20 | Complete validation | 🔄 Local pass; CI pending |

---

## Test Status (Local)

| Suite | Status |
|-------|--------|
| Unit tests | ✅ 8 passed |
| Typecheck | ✅ Passed |
| Build | ✅ Passed |
| Lint | ✅ Passed |

---

## Human Actions Required

1. **Create Supabase project** at [supabase.com](https://supabase.com)
2. **Configure env vars** in Railway and Vercel (see `.env.example`)
3. **Run migrations** on Supabase: `cd apps/api && npx prisma migrate deploy`
4. **Create storage buckets**: `knowledge`, `avatars`, `exports`
5. **Sync external docs** in `chatbotmaker-docs` repository
6. **Enable email auth** in Supabase dashboard

---

## Known Issues / Technical Debt

- Broader cross-tenant isolation integration tests for post-Phase-3 resources still thin (org membership checks exist in unit/service tests)
- RLS policies not implemented (application-level isolation only)
- StorageModule not wired to AppModule (used when Knowledge phase starts)
- Dashboard uses Supabase session; httpOnly cookie migration deferred
- Rate limiting not implemented

---

## Next Action

1. Deploy with Supabase credentials
2. Add tenant isolation integration tests
3. Sync `chatbotmaker-docs` infrastructure docs
