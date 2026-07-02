# Repository & Application Architecture Plan

**Product:** ChatbotMaker  
**Internal platform name:** Genie Platform  
**Version:** 2.0  
**Status:** Approved for implementation  
**Document type:** Architecture Decision Record (ADR)  
**Horizon:** MVP through 3–5 year vision

---

## 1. Purpose

This is one of the **most important architectural decisions** for ChatbotMaker. It affects development speed, scalability, deployment, hiring, and long-term maintenance.

This document records the official decision on:

1. Marketing site vs authenticated dashboard — separate or combined?
2. One repo or multiple repos?
3. NestJS backend vs Next.js API routes?
4. Where SSR applies — and where it does not?
5. How the AI platform layer is organized — modular monolith vs microservices?
6. How the system scales from MVP to enterprise without a rewrite?

Related documents:

- [Technical architecture](./03-technical-architecture.md)
- [Infrastructure](./04-infrastructure.md)
- [MVP roadmap](./05-mvp-roadmap.md)

---

## 2. Executive summary

| Decision | Recommendation |
|----------|----------------|
| Repository strategy | **Turborepo monorepo** (`genie-platform/`) |
| Marketing vs dashboard | **Separate applications**, same repo |
| Backend | **Dedicated NestJS API** — not Next.js API routes |
| Marketing frontend | **Next.js** with SSR/SSG |
| Dashboard frontend | **Next.js App Router** — mostly CSR + Server Components |
| Widget | **Separate app/package** — small embeddable JS bundle |
| AI engine | **Internal NestJS module** — not a separate service on day one |
| Database | **MongoDB Atlas** |
| Cache | **Redis Cloud** |
| Storage | **AWS S3** |
| Hosting | **Vercel** (frontends) + **Railway** (API, MVP) → **AWS ECS** (production) |

### In short

- ✅ **Monorepo** for the entire platform
- ✅ **Separate marketing and dashboard applications** within the monorepo
- ✅ **Dedicated NestJS backend**, not Next.js API routes
- ✅ **SSR for marketing only** — not for the authenticated dashboard
- ✅ **Modular monolith first** — microservices only when scale justifies it

**Do not build this as a single Next.js application with API routes.**

---

## 3. Recommended architecture

```text
                     Internet
                          │
                  Cloudflare CDN
                          │
            ┌─────────────┴─────────────┐
            │                           │
            ▼                           ▼
   Marketing Website             Application Dashboard
    (Next.js SSR)                 (Next.js App)
   chatbotmaker.com              app.chatbotmaker.com
            │                           │
            └─────────────┬─────────────┘
                          │
                     Railway (NestJS API — Docker)
                          │
                    NestJS Backend
                    (modular monolith)
                          │
       ┌──────────────────┼──────────────────┐
       │                  │                  │
       ▼                  ▼                  ▼
   MongoDB Atlas      Memory cache → Redis         AWS S3
                          │
                          ▼
                  AI Platform Layer
      Prompt • RAG • Memory • Actions • Models
                          │
                          ▼
              packages/widget (CDN)
              cdn.chatbotmaker.com
```

---

## 4. Context

### Why this decision matters

Many founders think: *"Next.js has API routes, so why do I need NestJS?"*

That works until the backend becomes a product. ChatbotMaker's backend is becoming:

- An AI platform
- A public REST API and SDK
- Billing and subscription management
- Analytics and usage tracking
- Webhooks and background jobs
- Cron jobs and document processing
- Multi-tenant organization management

That deserves its own service — not a few API routes inside a frontend framework.

### Current state

| Asset | Location | Notes |
|-------|----------|-------|
| Landing page | `apps/marketing/` | Live at [aichatbotmaker.vercel.app](https://aichatbotmaker.vercel.app) |
| Documentation | `Docs/` | Product, technical, and infra specs |
| Backend API | Scaffolded | NestJS health check in `apps/api` — deploy via Railway |
| Auth dashboard | Scaffolded | Shell in `apps/dashboard` |
| Widget / SDK | Scaffolded | Placeholder in `apps/widget` |

### Platform requirements (3–5 year vision)

- Public widget API (high traffic, API key auth)
- AI streaming (SSE) with no serverless timeout limits
- RAG pipeline (parsing, embeddings, vector search, re-ranking)
- Background jobs (crawling, re-indexing, email, analytics)
- Stripe billing, webhooks, usage metering
- Multi-tenant RBAC across organizations and teams
- Future: mobile SDK, partner API, AI actions, workflow automation, multi-agent orchestration

---

## 5. Decision 1 — Marketing site vs dashboard

### Option A — Separate applications ✅ (Approved)

```text
chatbotmaker.com          → Marketing (landing, pricing, blog, docs, SEO)
app.chatbotmaker.com      → Dashboard (login, builder, analytics, billing)
```

| Application | Purpose |
|-------------|---------|
| **Marketing** | Landing page, pricing, blog, documentation, SEO, conversion |
| **Dashboard** | Login, assistant builder, knowledge base, analytics, billing, settings |

### Why separate?

Marketing and dashboard are **completely different products**.

| Marketing wants | Dashboard wants |
|-----------------|-----------------|
| SEO | Authentication |
| SSR / SSG | React interactivity |
| Blog and content pages | API calls to NestJS |
| Fast static page loads | Real-time updates (chat, streaming) |
| No user sessions | User sessions and RBAC |
| Public access | Protected routes |

Mixing both in one Next.js app becomes messy over time — different deploy cadences, different performance profiles, different security boundaries.

### Decision

**Separate Next.js applications:** `apps/marketing` and `apps/dashboard`.

---

## 6. Decision 2 — One repo or multiple repos?

### Recommendation: Turborepo monorepo ✅

```text
genie-platform/                  # repo: vishnutvm/chatbotmaker

apps/
    marketing/                   # Next.js — SSR landing, pricing, blog, docs
    dashboard/                   # Next.js — authenticated app
    api/                         # NestJS — backend platform
    widget/                      # React/TS — embeddable chat bundle

packages/
    ui/                          # Shared React components
    sdk/                         # TypeScript SDK for developers
    api-client/                  # Typed API client for dashboard
    types/                       # Shared TypeScript interfaces
    config/                      # ESLint, TSConfig, Tailwind presets
    utils/                       # Shared utilities and validation

services/                        # Extract to deployables when scale demands
    ai-engine/                   # Phase 3+ — not separate on day one
    crawler/                     # Phase 2+
    worker/                      # Phase 2+

infrastructure/                  # Terraform, Docker, CI configs
docs/                            # Project documentation
```

### Tooling

| Tool | Purpose |
|------|---------|
| **pnpm workspaces** | Package management |
| **Turborepo** | Build caching, task orchestration across apps |
| **packages/types** | `Assistant`, `Organization`, `Plan` — shared everywhere |
| **packages/api-client** | Typed fetch wrapper used by dashboard |

### Why monorepo?

Everything stays synchronized:

- UI components
- Types and validation schemas
- API client
- SDK
- Utilities and config

One PR can ship a feature across frontend and backend. No version drift between repos.

### Migration from current setup

1. Create repo: `vishnutvm/chatbotmaker`
2. Move current `dashboard/` → `apps/marketing/`
3. Scaffold `apps/dashboard`, `apps/api`, `apps/widget`
4. Point Vercel marketing project to `apps/marketing`
5. Archive `vishnutvm/chatbot` when migration is complete

---

## 7. Decision 3 — Backend: Next.js API or NestJS?

### Recommendation: NestJS ✅

**Do not use Next.js API routes for the core platform backend.**

### What ChatbotMaker's backend includes

| Domain | Complexity |
|--------|------------|
| Authentication & sessions | Multi-provider OAuth, JWT, refresh rotation |
| Organizations & RBAC | Multi-tenant isolation |
| Billing | Stripe webhooks, usage metering, plan limits |
| AI & RAG | Streaming, embeddings, vector search |
| Background jobs | Document parsing, crawling, re-indexing |
| Analytics | Aggregation, usage counters |
| API keys & SDK | Public widget API, rate limiting |
| Webhooks | Inbound (Stripe) and outbound (customer) |

This is a **backend platform** — not a few CRUD routes.

### Next.js API routes are good for

- Small SaaS MVPs
- Simple CRUD
- Internal APIs
- Thin BFF proxies

### Next.js API routes are not ideal for

- AI platforms with streaming and long-running requests
- Background job processing
- Independent API scaling
- Public SDK and widget traffic at scale
- Webhook-heavy billing systems

### Decision

**NestJS modular monolith on Railway (MVP), migrating to AWS ECS for production.** Next.js may expose thin BFF routes later, but all business logic lives in NestJS.

---

## 8. Decision 4 — SSR strategy

### Use SSR where it makes sense. Not everywhere.

| Application | Rendering | Pages | Rationale |
|-------------|-----------|-------|-----------|
| **Marketing** | **SSR / SSG** | `/`, `/pricing`, `/features`, `/blog`, `/docs` | SEO matters |
| **Dashboard** | **CSR** + Server Components | `/login`, `/app/*` | No SEO needed; rich interactivity |
| **Widget** | **Client-only** | N/A | Embedded on third-party sites |
| **API** | N/A | N/A | REST + SSE only |

### Marketing — use SSR

```text
/           → SSG (landing)
/pricing    → SSG
/features   → SSG
/blog/*     → SSR or ISR
/docs/*     → SSR or SSG
/privacy    → SSG
/terms      → SSG
```

### Dashboard — mostly CSR

```text
/login              → Server Component shell + client form
/signup             → Server Component shell + client form
/app                → Protected layout (Server Component)
/app/assistants     → Client Component + TanStack Query
/app/knowledge      → Client Component + TanStack Query
/app/playground     → Client Component (streaming chat)
/app/analytics      → Client Component + charts
/app/billing        → Client Component + Stripe portal
```

The dashboard does **not** need SEO. Prioritize interactivity, real-time streaming, and fast client-side navigation.

### Dashboard frontend stack

| Technology | Purpose |
|------------|---------|
| Next.js App Router | Routing, layouts, Server Components |
| TanStack Query | Server state, caching, mutations |
| Zustand | Client UI state |
| packages/api-client | Typed calls to NestJS |

---

## 9. Decision 5 — AI platform organization

### Do not put AI logic inside controllers

Create a dedicated **AI Platform Layer** inside NestJS:

```text
apps/api/src/ai/
├── conversation.engine.ts
├── prompt.engine.ts
├── memory.engine.ts
├── rag.engine.ts
├── function-calling.engine.ts
├── action.engine.ts
├── model.router.ts
└── safety.guard.ts
```

### Modular monolith first — not microservices on day one

| Approach | When |
|----------|------|
| **Internal NestJS module** (AI platform layer) | **Day one** ✅ |
| Separate `services/ai-engine` deployable | When independent scaling or GPU workloads demand it |
| Dedicated vector service | When MongoDB Atlas vector search limits are hit |
| Worker cluster | Phase 2+ (BullMQ on ECS) |

**Do not split the AI engine into a separate deployable microservice on day one.**

Keep one NestJS application. Organize it into clear modules. Extract services only when there is a real operational need:

- Independent scaling of AI workloads
- Dedicated GPU infrastructure
- Multiple applications consuming the AI layer

This gives simplicity today and a clean migration path tomorrow — without paying microservices complexity cost too early.

---

## 10. NestJS backend modules

```text
apps/api/src/
├── auth/
├── organizations/
├── users/
├── assistants/
├── knowledge/
├── documents/
├── crawler/              # Phase 2
├── conversations/
├── actions/              # Phase 2
├── analytics/
├── billing/
├── notifications/
├── settings/
└── ai/                   # AI Platform Layer (see Section 9)
```

Exactly what NestJS excels at: modular, testable, dependency-injected services with clear boundaries.

---

## 11. Frontend application structure

```text
apps/

marketing/          Next.js — SSR/SSG
    ├── app/
    │   ├── page.tsx          # Landing
    │   ├── pricing/
    │   ├── features/
    │   ├── blog/             # Phase 2
    │   └── docs/             # Phase 2
    └── components/

dashboard/          Next.js — App Router, CSR + Server Components
    ├── app/
    │   ├── (auth)/           # login, signup
    │   └── (dashboard)/      # assistants, knowledge, analytics, billing
    └── lib/
        └── api-client.ts     # uses packages/api-client

widget/             Small JS bundle — embeddable
    └── src/
        ├── chat-widget.tsx
        └── index.ts          # window.ChatbotMaker.init()
```

---

## 12. Data layer

No change from existing technical architecture.

| Service | Purpose |
|---------|---------|
| **MongoDB Atlas** | Primary database + vector search |
| **Redis Cloud** | Sessions, prompt cache, rate limiting, usage counters |
| **AWS S3** | Documents, avatars, exports |

### Redis responsibilities

- Session cache
- Prompt cache (compiled assistant prompts)
- Rate limiting (per org, per API key)
- Usage counters (monthly message/token counts)

---

## 13. Deployment architecture

### Marketing

```text
GitHub → GitHub Actions → Vercel (apps/marketing)
URL: chatbotmaker.com / aichatbotmaker.vercel.app
```

### Dashboard

```text
GitHub → GitHub Actions → Vercel (apps/dashboard)
URL: app.chatbotmaker.com
```

### API

```text
GitHub → GitHub Actions → Docker build → Railway
URL: api.chatbotmaker.com
```

### Widget

```text
GitHub → GitHub Actions → Build bundle → Cloudflare CDN
URL: cdn.chatbotmaker.com/widget.js
```

### Full deployment map

| App | Host | URL | Trigger |
|-----|------|-----|---------|
| `apps/marketing` | Vercel | `chatbotmaker.com` | Push to `main` |
| `apps/dashboard` | Vercel | `app.chatbotmaker.com` | Push to `main` |
| `apps/api` | Railway (MVP) → AWS ECS | `api.chatbotmaker.com` | Push to `main` |
| `apps/widget` | Cloudflare CDN | `cdn.chatbotmaker.com` | Release tag |

---

## 14. Long-term scalability path

### Today (MVP)

```text
Next.js (marketing + dashboard)
        ↓
NestJS (modular monolith)
        ↓
AI Platform Layer (internal module)
        ↓
MongoDB + Redis + S3
```

### Growth (1,000+ customers)

```text
Next.js
        ↓
API Gateway (ALB)
        ↓
NestJS (auto-scaled ECS tasks)
        ↓
BullMQ Workers (ECS)
        ↓
AI Platform Layer
        ↓
MongoDB + Redis + S3
```

### Scale (10,000+ customers)

```text
Next.js
        ↓
API Gateway
        ↓
NestJS API
        ↓
AI Workers (dedicated ECS service)
Vector Service (if needed)
Crawler Workers
        ↓
MongoDB + Redis + S3
```

**No rewrite needed.** The modular monolith extracts into services incrementally as operational needs arise.

---

## 15. CTO decision table

| Component | Technology | Decision |
|-----------|------------|----------|
| Marketing website | Next.js (SSR/SSG) | ✅ Separate app |
| Dashboard | Next.js App Router (CSR + Server Components) | ✅ Separate app |
| Backend API | NestJS | ✅ Separate service |
| AI engine | Internal NestJS modules → separate service later | ✅ Modular monolith first |
| Widget | React/TypeScript (`apps/widget`) | ✅ Separate app |
| SDK | TypeScript (`packages/sdk`) | ✅ Separate package |
| API client | TypeScript (`packages/api-client`) | ✅ Shared package |
| Repository | Turborepo monorepo + pnpm | ✅ Yes |
| Database | MongoDB Atlas | ✅ Yes |
| Cache | Redis Cloud | ✅ Yes |
| Storage | AWS S3 | ✅ Yes |
| CDN | Cloudflare | ✅ Yes |
| Hosting | Vercel + AWS ECS | ✅ Yes |

---

## 16. Why not everything in Next.js?

| Concern | Single Next.js app | Recommended architecture |
|---------|-------------------|--------------------------|
| Marketing SEO vs dashboard interactivity | Conflicting needs in one app | Separate apps |
| API serverless timeouts | Breaks AI streaming | NestJS on ECS |
| Background jobs | No native worker support | BullMQ on ECS |
| Widget traffic | Coupled to dashboard deploy | Independent CDN bundle |
| API scaling | Cannot scale separately | ECS auto-scaling |
| Hiring | Full-stack only | Frontend + backend specialists |
| 3–5 year vision | Requires full rewrite | Incremental service extraction |
| Team velocity (early) | Faster initially | Monorepo keeps velocity high |

---

## 17. Comparison matrix

| Question | Answer |
|----------|--------|
| Single Next.js app with API routes? | **No** |
| Separate marketing and dashboard apps? | **Yes** |
| One monorepo for entire platform? | **Yes** (Turborepo + pnpm) |
| Dedicated NestJS backend? | **Yes** |
| SSR on marketing? | **Yes** |
| SSR on dashboard? | **No** — CSR + Server Components |
| AI as separate microservice day one? | **No** — internal module first |
| Widget separate from dashboard? | **Yes** |
| Migrate `vishnutvm/chatbot`? | **Yes** → `apps/marketing` |

---

## 18. Implementation phases

### Phase 0 — Monorepo scaffold

- [ ] Create `vishnutvm/chatbotmaker` repo
- [ ] Initialize Turborepo + pnpm workspaces
- [ ] Move `dashboard/` → `apps/marketing/`
- [ ] Scaffold `apps/dashboard`, `apps/api`, `apps/widget`
- [ ] Scaffold `packages/types`, `packages/ui`, `packages/config`
- [ ] Verify marketing builds on Vercel from new path

### Phase 1 — Core platform

- [ ] `apps/api`: NestJS health check, MongoDB, auth module
- [ ] `apps/dashboard`: auth pages, protected layout, TanStack Query
- [ ] `packages/api-client`: typed API wrapper
- [ ] `apps/widget`: empty bundle + CDN build pipeline

### Phase 2 — Wire deployments

- [ ] Vercel: separate projects for `marketing` and `dashboard`
- [ ] AWS ECS + ALB for `apps/api`
- [ ] Cloudflare CDN for widget
- [ ] GitHub Actions: CI/CD per app with Turborepo caching

### Phase 3 — Deprecate old repo

- [ ] Confirm Vercel points to monorepo
- [ ] Archive `vishnutvm/chatbot`

See [MVP roadmap](./05-mvp-roadmap.md) for feature-level build sequence.

---

## 19. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Monorepo setup slows MVP | Turborepo caching; scaffold incrementally |
| Two Vercel projects to manage | Document in infra; automate via GitHub Actions |
| Temptation to use Next.js API for speed | Enforce this ADR; code review gate |
| Over-engineering microservices early | Modular monolith until operational need is proven |
| Marketing Vercel deploy breaks on migration | Test `apps/marketing` build before switching remote |
| Dashboard confused with marketing repo folder | Rename current `dashboard/` → `apps/marketing/` clearly |

---

## 20. Alternatives rejected

| Alternative | Reason rejected |
|-------------|-----------------|
| Single Next.js full-stack app | Backend becomes a product; serverless limits break AI |
| Next.js API routes for core backend | Wrong tool for AI platform complexity |
| Separate repos per app | Type drift, cross-repo PRs, harder synchronization |
| SSR on dashboard | No SEO benefit; adds unnecessary complexity |
| AI microservice on day one | Premature complexity; modular monolith is sufficient |
| No monorepo | Shared types, SDK, and UI become unsynchronized |
| Kubernetes on day one | Over-engineering for MVP scale |

---

## 21. Decision log

| Date | Decision | Status |
|------|----------|--------|
| July 2026 | Turborepo monorepo (`genie-platform`) | Approved |
| July 2026 | Separate `apps/marketing` and `apps/dashboard` | Approved |
| July 2026 | NestJS modular monolith; not Next.js API | Approved |
| July 2026 | SSR for marketing only; CSR for dashboard | Approved |
| July 2026 | AI platform as internal NestJS module | Approved |
| July 2026 | Widget as `apps/widget` on CDN | Approved |
| July 2026 | Migrate `vishnutvm/chatbot` → `apps/marketing` | Planned |

---

## 22. Next action

Begin **Phase 0**: scaffold the Turborepo monorepo and move the current `dashboard/` folder into `apps/marketing/`.

This architecture will serve ChatbotMaker for several years without requiring a major rewrite.
