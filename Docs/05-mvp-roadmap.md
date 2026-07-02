# MVP Roadmap

**Product:** ChatbotMaker  
**Version:** 1.0  
**Status:** Active  
**Last updated:** July 2026

---

## 1. Overview

This roadmap takes ChatbotMaker from the **live landing page** to a **production-ready SaaS MVP**, then through growth phases aligned with [Product vision](./01-product-vision.md), [Functional specification](./02-functional-specification.md), and [Repository & application architecture](./07-repository-and-application-architecture.md).

---

## 2. Current state

| Deliverable | Status | Notes |
|-------------|--------|-------|
| Landing page | ✅ Done | [aichatbotmaker.vercel.app](https://aichatbotmaker.vercel.app) |
| Brand messaging | ✅ Done | Features, 3-step flow, pricing, FAQ |
| Product documentation | ✅ Done | This docs set |
| Dashboard app | 🔲 Scaffold only | `apps/dashboard` shell |
| Backend API | 🔲 Health check | `apps/api` — Railway/Docker scaffold |
| Widget / SDK | 🔲 Not started | |
| RAG pipeline | 🔲 Not started | |
| Billing | 🔲 Not started | |

---

## 3. Phase 0 — Foundation (Week 1–2)

**Goal:** Turborepo monorepo scaffold and development environment ready.

### Tasks

- [ ] Create `vishnutvm/chatbotmaker` repo
- [ ] Initialize Turborepo + pnpm workspaces
- [ ] Move current `dashboard/` → `apps/marketing/`
- [ ] Scaffold `apps/dashboard` (Next.js App Router, auth shell)
- [ ] Scaffold `apps/api` (NestJS, health check)
- [ ] Scaffold `apps/widget` (empty embed bundle)
- [ ] Scaffold `packages/types`, `packages/ui`, `packages/config`, `packages/api-client`
- [ ] Configure TypeScript, ESLint, Prettier across workspace
- [ ] Set up GitHub repo + branch protection
- [ ] Connect Vercel: separate projects for `apps/marketing` and `apps/dashboard`
- [ ] Connect Railway: API service via `docker/Dockerfile` + `railway.toml`
- [ ] Provision MongoDB Atlas (free tier), S3 (dev bucket)
- [ ] Add `.env.example` files (no secrets committed)
- [ ] GitHub Actions: Turborepo lint + test + Docker verify on PR

### Exit criteria

- `pnpm dev` runs marketing + dashboard + API locally
- CI passes on scaffold
- Marketing still deploys on Vercel from `apps/marketing`
- Staging URLs defined

---

## 4. Phase 1 — Core MVP (Week 3–8)

**Goal:** A paying customer can sign up, create a bot, upload a PDF, chat with it, and embed it on their site.

### 1A — Authentication & tenancy (Week 3)

- [ ] User registration + login (email/password)
- [ ] Google OAuth
- [ ] Email verification
- [ ] JWT auth + refresh tokens
- [ ] Create organization on signup
- [ ] Basic dashboard shell (sidebar, org switcher)

### 1B — AI assistant (Week 4)

- [ ] CRUD assistants (name, prompt, model, temperature)
- [ ] Personality / tone presets (Professional, Friendly, Witty)
- [ ] Greeting message
- [ ] Playground chat UI (test without embedding)
- [ ] Streaming responses (SSE)

### 1C — Knowledge base + RAG (Week 5–6)

- [ ] PDF upload → S3 → parse → chunk → embed
- [ ] TXT, Markdown upload
- [ ] Single URL ingestion (fetch + parse HTML)
- [ ] Vector search (MongoDB Atlas Vector Search)
- [ ] RAG injection into conversation pipeline
- [ ] Source citations in responses
- [ ] Plan limits: Free = 1 PDF 5MB

### 1D — Widget (Week 7)

- [ ] Lightweight `widget.js` bundle
- [ ] Chat bubble + panel UI (light/dark theme)
- [ ] API key auth (`pk_live_...`)
- [ ] Embed snippet generator in dashboard
- [ ] Host on CDN (Cloudflare)

### 1E — Billing (Week 8)

- [ ] Stripe products: Free, Starter ($15), Pro ($49)
- [ ] Checkout flow + customer portal
- [ ] Usage tracking: messages/month, bot count
- [ ] Enforce limits middleware
- [ ] Upgrade prompts in dashboard

### MVP exit criteria

- [ ] End-to-end demo: signup → create bot → upload doc → embed → live chat
- [ ] Free and paid plans work
- [ ] Landing page "Start Free" links to real signup
- [ ] Deployed to staging + production

---

## 5. Phase 2 — Growth features (Month 3–4)

**Goal:** Match full landing page promise and improve retention.

- [ ] DOCX, CSV upload support
- [ ] Full website crawling + sitemap import
- [ ] Scheduled re-crawl
- [ ] React SDK
- [ ] Advanced analytics (popular questions, gaps)
- [ ] Team invites + RBAC (Admin, Developer, Member)
- [ ] Webhooks (conversation events)
- [ ] BullMQ background workers
- [ ] Bring-your-own OpenAI API key (FAQ promise)
- [ ] Custom domain for widget (Pro)

---

## 6. Phase 3 — AI actions (Month 5–6)

**Goal:** Move from Q&A bot to action-capable agent.

- [ ] API function calling UI (define endpoints, headers, mapping)
- [ ] Webhook actions
- [ ] Pre-built actions: create ticket, send email
- [ ] Action analytics
- [ ] CRM integrations (HubSpot starter)

---

## 7. Phase 4 — Scale & enterprise prep (Month 7+)

- [ ] ECS auto-scaling + dedicated AI workers
- [ ] Multi-provider model router (Anthropic, Gemini)
- [ ] SSO / SAML
- [ ] Audit log export
- [ ] GDPR data export/delete
- [ ] Enterprise custom pricing flow
- [ ] SLA monitoring + status page

---

## 8. Long-term (12+ months)

- Workflow builder (visual automation)
- Multi-agent orchestration
- Voice AI
- WhatsApp, Slack, Teams channels
- Plugin marketplace
- MCP integration
- Mobile SDK

---

## 9. Target repository structure

Aligned with [Repository & application architecture](./07-repository-and-application-architecture.md):

```text
genie-platform/                   # repo: vishnutvm/chatbotmaker

apps/
    marketing/                  # Next.js SSR — current landing page
    dashboard/                  # Next.js App Router — authenticated app
    api/                        # NestJS modular monolith
    widget/                     # Embeddable chat bundle

packages/
    ui/                         # Shared React components
    sdk/                        # TypeScript SDK
    api-client/                 # Typed API client
    types/                      # Shared interfaces
    config/                     # ESLint, TSConfig, Tailwind presets
    utils/                      # Validation, helpers

services/                       # Extract when scale demands (not day one)
    ai-engine/
    crawler/
    worker/

infrastructure/                 # Terraform, Docker, CI
docs/                           # Project documentation
turbo.json
pnpm-workspace.yaml
package.json
```

---

## 10. Priority matrix

| Priority | Feature | Why |
|----------|---------|-----|
| P0 | Auth + org | Nothing works without it |
| P0 | Assistant CRUD + playground | Core product value |
| P0 | PDF RAG | Landing page promise |
| P0 | Widget embed | Primary distribution |
| P0 | Stripe billing | Revenue |
| P1 | URL ingestion | Starter plan feature |
| P1 | Analytics basics | Usage limits + retention |
| P1 | Team invites | B2B requirement |
| P2 | Website crawl | Differentiator |
| P2 | API actions | Agent platform vision |
| P3 | Multi-agent, voice | Long-term |

---

## 11. Success metrics (MVP launch)

| Metric | Target (90 days post-launch) |
|--------|------------------------------|
| Signups | 500+ |
| Activated (1+ bot created) | 40% of signups |
| Embedded (widget live) | 20% of activated |
| Paid conversions | 5% of activated |
| Monthly churn | &lt; 10% |
| Avg. response latency (first token) | &lt; 2s |
| Uptime | 99.5%+ |

---

## 12. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| OpenAI cost overrun | Rate limits per plan; cheaper default model |
| RAG quality poor | Chunk tuning, re-rank, user feedback loop |
| Slow MVP scope creep | Strict Phase 1 scope; defer actions to Phase 3 |
| Widget blocked by ad blockers | First-party CDN domain; avoid "chat" in script name |
| Competitor pressure | Ship fast; focus on developer UX + pricing |

---

## 13. Next immediate action

**Start Phase 0:** scaffold the Turborepo monorepo and move the current `dashboard/` folder into `apps/marketing/`.

Recommended first commits:

1. `apps/api` — NestJS with health check + MongoDB connection
2. `apps/dashboard` — Next.js with auth pages (shell only)
3. `apps/marketing` — migrated landing page (already built)
4. `packages/types` + `packages/api-client` — shared contracts
