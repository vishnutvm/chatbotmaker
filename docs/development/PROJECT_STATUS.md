# Project Status — Genie MVP

**Last Updated:** 2026-07-15

---

## MVP roadmap (Genie Phases)

| Phase | Focus | Status | Exit notes |
|-------|--------|--------|------------|
| 1 | Foundation | Done | Monorepo, CI, Railway/Vercel scaffold |
| 2 | Authentication | Done | Supabase Auth + Nest onboard / session / JWKS |
| 3 | Organizations | Done | Multi-org membership, Team UI, email invitations, org switcher. Docs: `docs/features/ORGANIZATIONS.md`, `docs/api/organizations.md`, `docs/database/MULTI_TENANCY.md` |
| 4 | AI platform | Done (U1) | LLM layer + org-scoped chat JSON/SSE live on Railway. Docs: `docs/features/AI_PLATFORM.md`, `docs/api/ai-chat.md`, ADR 0002 |
| 5 | Knowledge (RAG) | Next | Upload → chunk → embed → retrieve → inject into AI chat |
| 6 | Assistants | Backlog | CRUD, playground UI wired to real AI |
| 7–10 | Widget → Billing → Analytics → Production | Backlog | Per `Docs/05-mvp-roadmap.md` |

---

## Cleared 2026-07-14 → 2026-07-15 (this delivery window)

### Product / engineering

1. **Phase 3 residual docs** — `ORGANIZATIONS.md`, `MULTI_TENANCY.md`, API orgs/invites, DB design for invitations.
2. **Phase 4 Unit 1 — AI Platform Core** ([PR #2](https://github.com/vishnutvm/chatbotmaker/pull/2), merge `5ab7e05`):
   - `AIProvider` + `OpenAiProvider` (openai only in provider)
   - `POST /api/v1/organizations/:organizationId/ai/chat/completions`
   - `POST …/completions/stream` (SSE: meta / delta / done / error)
   - Prompt assembly, server-enforced `AI_DEFAULT_MODEL` (`gpt-4o-mini`)
   - `ai_usage_events` metering stub + in-memory rate limits (30/user, 60/org)
   - Pre-SSE **503** when `OPENAI_API_KEY` missing
   - Shared types + thin `GenieAiClient.complete()`
3. **Reviews** — security / performance / code Approve; live feature + UI/UX Approve after Railway redeploy.
4. **Live verification (2026-07-15)** — health 200; unauthenticated AI chat/stream **401** (routes present); web `/` and `/login` 200.

### Explicitly out of scope (deferred)

| Item | Phase / when |
|------|--------|
| Knowledge / RAG / embeddings HTTP | 5 |
| Assistants CRUD + real playground UI | 6 |
| Widget public chat | 7 |
| Billing meter enforcement | 8 |
| **Org Analytics page** (`/dashboard/analytics`) | **Phase 9 — Analytics.** Hidden from nav; route redirects to Assistants home. Source kept at `analytics.tsx`. |
| **Metrics dashboard Home** (totals, activity chart, insight cards) | **Post-MVP.** Hidden — Assistants list is `/dashboard` home for MVP. Source kept at `dashboard-home.tsx`. |
| **Dashboard “Actionable insights”** (unanswered Qs, re-sync prompts, deploy nudges) | **Post-MVP — Phase 9 Analytics / later.** Part of deferred metrics Home. |
| App-wide 100% coverage campaign (Layer B) | Optional — awaiting PO |

### Notion

- Phase 3 docs residual → Done  
- P4 architecture / scaffold / streaming / tests → Done  
- P4 playground smoke UI → Archived (not required for U1)  
- Phase 4 → Done (platform unit complete)  
- Open Genie Tasks for next work → none (create Phase 5 tasks on start)

---

## Key document index (keep current)

| Topic | Path |
|-------|------|
| AI API contract | `docs/api/ai-chat.md` |
| AI architecture | `docs/architecture/AI_PLATFORM_ARCHITECTURE.md` |
| AI feature notes | `docs/features/AI_PLATFORM.md` |
| AI provider ADR | `docs/adr/0002-ai-provider-abstraction.md` |
| Orgs feature | `docs/features/ORGANIZATIONS.md` |
| Orgs API | `docs/api/organizations.md` |
| Multi-tenancy | `docs/database/MULTI_TENANCY.md` |
| Schema / usage events | `docs/database/DATABASE_DESIGN.md` |

---

## Supabase migration workstream (historical)

Earlier “migration phases” 1–19 complete; phase 20 validation largely done in CI for API. Application isolation remains the tenancy model (RLS deferred).

---

## Known debt (non-blocking for Phase 4 Done)

- RLS policies not implemented (app-level tenant checks only)
- StorageModule not wired into AppModule until Knowledge phase
- Playwright full-stack auth e2e intermittently flaky in CI (not a required merge gate)
- Railway deploy often needs manual redeploy until `Wait for CI` is off or `ENABLE_RAILWAY_GHA_DEPLOY` + `RAILWAY_TOKEN` are set
- AI rate limiter is in-memory (Redis later / Phase 10)

---

## UI polish (2026-07-15)

Presentation-only Premium SaaS redesign on `apps/web` (tokens, sidebar, dashboard, assistants, playground, inbox, billing/team/settings, wizard). No API/route/business-logic changes. Theme: Inter system stack + violet/indigo oklch tokens; shared light/dark/system toggle (marketing + dashboard).

**MVP Home:** signed-in home is **Assistants** at `/dashboard` (metrics Home, Actionable insights, and **org Analytics** deferred — see table above). `/dashboard/assistants` and `/dashboard/analytics` redirect to `/dashboard`; nested assistant routes unchanged.

---

## Next action

1. **PO:** Layer B coverage campaign? Reply **yes** / **no** (optional).  
2. **Engineering continuum:** Start **Phase 5 — Knowledge (RAG)** — contracts + schema + ingestion pipeline wired into `AIProvider` / chat context.  
3. Ops hygiene: keep `OPENAI_API_KEY` set on Railway; prefer fixing auto-deploy so manual Railway builds are not required.  
4. Ship UI redesign commit when PO confirms visual QA.
