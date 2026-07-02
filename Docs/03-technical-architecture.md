# Technical Architecture

**Product:** ChatbotMaker (Genie)  
**Version:** 1.0  
**Status:** Draft  
**Document type:** Technical Design Document (TDD)

---

## 1. Purpose

This document defines **how** the platform is built — architecture, stack, AI pipelines, data model, APIs, security, and deployment. Functional requirements are in [Functional specification](./02-functional-specification.md).

**Repository and application structure** (monorepo, marketing vs dashboard, SSR, NestJS vs Next.js API) is defined in [Repository & application architecture](./07-repository-and-application-architecture.md). This document focuses on system internals.

---

## 2. Technical goals

| Goal | Description |
|------|-------------|
| Scalability | Solo business → enterprise |
| Extensibility | Modular, replaceable components |
| Multi-tenant | Strict org-level data isolation |
| Cloud native | Containerized on AWS |
| AI native | Multi-provider LLM support (OpenAI first) |
| API first | Every feature exposed via REST |
| Secure | Enterprise-grade auth, encryption, audit |

---

## 3. System overview

```text
                     Internet
                          │
                  Cloudflare CDN
                          │
            ┌─────────────┴─────────────┐
            │                           │
            ▼                           ▼
   apps/marketing (SSR)         apps/dashboard (CSR)
            │                           │
            └─────────────┬─────────────┘
                          │
                     API Gateway (ALB)
                          │
                    NestJS Backend
                  (modular monolith)
                          │
       ┌──────────────────┼──────────────────┐
       │                  │                  │
       ▼                  ▼                  ▼
   MongoDB Atlas      Redis Cloud         AWS S3
                          │
                          ▼
                  AI Platform Layer
    ┌─────────────────────┐
    │ Conversation Engine │
    │ Prompt Engine       │
    │ Memory Engine       │
    │ RAG Engine          │
    │ Function Calling    │
    │ Action Engine       │
    │ Model Router        │
    │ Safety & Guardrails │
    └─────────┬───────────┘
              │
              ▼
    apps/widget (CDN) · OpenAI · Stripe
```

### Key architectural decisions

1. **Separate applications** — `apps/marketing` and `apps/dashboard` are distinct Next.js apps (see [ADR](./07-repository-and-application-architecture.md)).
2. **NestJS modular monolith** — not Next.js API routes. AI platform is an internal module, not a separate microservice on day one.
3. **Provider-agnostic AI layer** — switching LLM providers only touches the AI module.

---

## 4. Technology stack

### Frontend

| Technology | Purpose |
|------------|---------|
| Next.js 16+ | Marketing (SSR/SSG) + dashboard (App Router) |
| React 19+ | UI components |
| TypeScript | Type safety |
| Tailwind CSS 4 | Styling |
| TanStack Query | Dashboard server state |
| Zustand | Client UI state |
| Turborepo + pnpm | Monorepo build orchestration |

### Backend

| Technology | Purpose |
|------------|---------|
| NestJS | Modular API framework |
| Node.js 20 LTS | Runtime |
| TypeScript | Type safety |
| class-validator | DTO validation |
| BullMQ (Phase 2) | Background jobs |

### Data & infrastructure

| Service | Purpose |
|---------|---------|
| MongoDB Atlas | Primary database (free tier → M10) |
| Memory cache / Redis Cloud | Sessions, cache, rate limits (abstracted) |
| AWS S3 | Documents, avatars, exports |
| Railway | API hosting (MVP) → AWS ECS Fargate (production) |
| Cloudflare | CDN, DNS, WAF |
| Vercel | Frontend hosting |
| OpenAI | LLM + embeddings |
| Stripe | Billing |
| AWS SES | Transactional email |

---

## 5. Frontend architecture

> Full application split, SSR decisions, and monorepo layout: [Repository & application architecture](./07-repository-and-application-architecture.md)

### Application surfaces

```text
apps/marketing (aichatbotmaker.vercel.app)  ← LIVE
  ├── Landing, pricing, features, FAQ
  ├── Blog, docs (Phase 2)
  └── Rendering: SSR / SSG (SEO)

apps/dashboard (app.chatbotmaker.com)       ← Planned
  ├── Authentication (login, signup)
  ├── Assistant builder + playground
  ├── Knowledge base manager
  ├── Analytics, billing, team, settings
  └── Rendering: CSR + Server Components (no SEO)

apps/widget (cdn.chatbotmaker.com)          ← Planned
  └── Lightweight embeddable JS bundle
```

Both frontends communicate exclusively through the NestJS REST API (`/api/v1/...`) via `packages/api-client`. **No business logic in Next.js API routes.**

---

## 6. Backend architecture

### NestJS modules (modular monolith — MVP)

```text
apps/api/src/
├── auth/
├── users/
├── organizations/
├── workspaces/
├── assistants/
├── knowledge/
│   ├── documents/
│   ├── chunks/
│   └── embeddings/
├── documents/
├── crawler/               # Phase 2
├── conversations/
├── actions/               # Phase 2
├── analytics/
├── billing/
├── notifications/
├── settings/
└── ai/                    # AI Platform Layer (internal module)
    ├── conversation.engine.ts
    ├── prompt.engine.ts
    ├── memory.engine.ts
    ├── rag.engine.ts
    ├── function-calling.engine.ts
    ├── action.engine.ts
    ├── model.router.ts
    └── safety.guard.ts
```

Each business module follows:

- **Controller** — HTTP routes, auth guards
- **Service** — business logic
- **Repository** — MongoDB access
- **DTO** — request/response validation
- **Events** — domain events (assistant.created, etc.)

---

## 7. AI architecture

### Conversation pipeline

```text
User message
    │
    ▼
Prompt Builder        ← system prompt + instructions + personality
    │
    ▼
Memory Builder        ← recent messages, session context
    │
    ▼
Knowledge Search      ← RAG retrieval (if enabled)
    │
    ▼
Context Builder       ← merge prompt + memory + retrieved chunks
    │
    ▼
Function Calling      ← optional tool/API calls
    │
    ▼
LLM (via Model Router)
    │
    ▼
Response Formatter    ← citations, markdown, safety filter
    │
    ▼
Streaming (SSE) → client
```

### Responsibilities

- Prompt generation and token budgeting
- Conversation memory (sliding window + summarization later)
- Model routing (cost vs quality per plan)
- Streaming first-token latency optimization
- Safety guardrails (PII, injection, content policy)

---

## 8. RAG architecture

```text
Upload / URL
    │
    ▼
Extract text          ← pdf-parse, mammoth (DOCX), cheerio (HTML)
    │
    ▼
Chunk                 ← ~500 tokens, overlap 50
    │
    ▼
Generate embeddings   ← OpenAI text-embedding-3-small
    │
    ▼
Store                 ← MongoDB (chunks + embedding vectors)
    │
    ▼
Query time:
  User question → embed → vector search → top-k chunks
    │
    ▼
Re-rank (optional)    ← cosine similarity + metadata boost
    │
    ▼
Inject into prompt context
    │
    ▼
LLM generates grounded answer with citations
```

### Supported sources (phased)

| Source | MVP | Phase 2 |
|--------|-----|---------|
| PDF | ✅ | |
| DOCX, TXT, MD, CSV | ✅ | |
| Manual text | ✅ | |
| Website URL (single page) | ✅ | |
| Full site crawl | | ✅ |
| Sitemap | | ✅ |

---

## 9. Agent architecture

Assistants are treated as **AI agents** with a decision loop:

```text
User message
    → Intent detection (lightweight, prompt-based MVP)
    → Knowledge search (if informational)
    → API decision (if action required)
    → Function calling
    → Business action execution
    → Natural language response
```

**Future:** multi-agent collaboration, workflow execution, planner/executor patterns.

---

## 10. Database design

### MongoDB collections

| Collection | Key fields |
|------------|------------|
| `users` | email, passwordHash, oauth, profile |
| `organizations` | name, plan, stripeCustomerId, ownerId |
| `workspaces` | orgId, name, settings |
| `assistants` | orgId, name, prompt, model, temperature, widgetConfig |
| `knowledge_sources` | assistantId, type, status, metadata |
| `documents` | sourceId, s3Key, filename, size, status |
| `document_chunks` | documentId, content, tokenCount, embedding |
| `conversations` | assistantId, sessionId, metadata |
| `messages` | conversationId, role, content, sources, feedback |
| `actions` | assistantId, type, config, enabled |
| `api_integrations` | assistantId, endpoint, auth, mapping |
| `subscriptions` | orgId, stripeSubscriptionId, plan, status |
| `usage` | orgId, period, messages, tokens, documents |
| `audit_logs` | orgId, userId, action, resource, timestamp |

### Indexes

- `organizationId` on all tenant-scoped collections
- `assistantId` on knowledge, conversations, messages
- `conversationId` on messages
- `userId` on audit_logs
- Vector index on `document_chunks.embedding` (Atlas Vector Search)

---

## 11. Cache strategy (Redis)

| Use case | TTL | Key pattern |
|----------|-----|-------------|
| JWT session / refresh | 7d / 30d | `session:{userId}` |
| Conversation context | 1h | `conv:{sessionId}` |
| Prompt template cache | 24h | `prompt:{assistantId}` |
| Rate limiting | 1m–1h | `rl:{orgId}:{endpoint}` |
| Usage counters | Monthly | `usage:{orgId}:{metric}:{period}` |

---

## 12. Storage strategy (S3)

```
s3://chatbotmaker-prod/
├── documents/{orgId}/{documentId}/
├── avatars/{orgId}/{assistantId}/
├── exports/{orgId}/
├── backups/
└── temp/                    # Auto-expire 24h
```

- Versioning enabled on production bucket
- Pre-signed URLs for secure upload/download
- Max file size enforced per plan (Free: 5MB PDF)

---

## 13. API architecture

### Base URL

```text
Production: https://api.chatbotmaker.com/api/v1
```

### Authentication

| Method | Use case |
|--------|----------|
| JWT Bearer | Dashboard users |
| API key (`pk_live_...`) | Widget, SDK, server-to-server |

### Core endpoints (representative)

```text
POST   /auth/register
POST   /auth/login
POST   /auth/google

GET    /organizations
POST   /organizations

GET    /assistants
POST   /assistants
PATCH  /assistants/:id
DELETE /assistants/:id

POST   /assistants/:id/knowledge/upload
POST   /assistants/:id/knowledge/url
GET    /assistants/:id/knowledge
DELETE /assistants/:id/knowledge/:docId

POST   /chat                          # Public widget endpoint (API key)
POST   /chat/stream                   # SSE streaming

GET    /analytics/usage
GET    /analytics/conversations

POST   /billing/checkout
POST   /billing/webhook               # Stripe
GET    /billing/portal
```

- OpenAPI 3.0 spec generated from NestJS decorators
- Rate limiting per plan and per API key
- Versioned URLs — breaking changes only in `/v2`

---

## 14. Authentication & authorization

### Auth methods

- Email + password (bcrypt)
- Google OAuth 2.0
- GitHub OAuth (post-MVP)
- Magic link (post-MVP)

### RBAC roles

| Role | Scope |
|------|-------|
| Owner | Full org + billing |
| Admin | Assistants, knowledge, team |
| Developer | API keys, integrations |
| Member | Read-only analytics |

Authorization enforced via NestJS guards on every route. All queries scoped by `organizationId`.

---

## 15. Multi-tenant architecture

- Every resource carries `organizationId`
- Middleware extracts org from JWT or API key
- No cross-tenant queries — enforced at repository layer
- Row-level logical isolation (shared DB, tenant-scoped indexes)
- Future: dedicated DB per enterprise customer

---

## 16. Background jobs

| Job | Trigger | Phase |
|-----|---------|-------|
| Embedding generation | Document uploaded | MVP |
| Document parsing | Upload complete | MVP |
| Website crawl | URL added | Phase 2 |
| Re-indexing | Manual or scheduled | Phase 2 |
| Email (verify, invite) | User action | MVP |
| Analytics aggregation | Hourly cron | Phase 2 |
| Cleanup (temp files) | Daily | MVP |

Queue: BullMQ + Redis (introduced Phase 2; sync processing acceptable for MVP with low volume).

---

## 17. Billing system

- Stripe Checkout for new subscriptions
- Stripe Customer Portal for self-service
- Webhook handler for `invoice.paid`, `subscription.updated`, etc.
- Usage middleware increments counters; blocks when limit exceeded
- Plan metadata stored in Stripe Products/Prices

---

## 18. Security

| Control | Implementation |
|---------|----------------|
| Transport | TLS 1.2+, HTTPS everywhere |
| Auth | JWT (short-lived) + refresh rotation |
| Secrets | AWS Secrets Manager |
| Input validation | class-validator on all DTOs |
| Headers | Helmet, CSP, CORS whitelist |
| Rate limiting | Redis-backed per org/key |
| Audit | All destructive actions logged |
| Widget | API key scoped to single assistant |
| Data | Encryption at rest (Atlas, S3 SSE) |

---

## 19. Monitoring & observability

| Tool | Purpose |
|------|---------|
| CloudWatch | Logs, metrics, alarms |
| Sentry | Error tracking (frontend + backend) |
| Custom metrics | AI latency, token usage, RAG hit rate |

**Future:** Grafana + Prometheus + Loki

---

## 20. Deployment

See [Infrastructure](./04-infrastructure.md) for full detail.

```text
GitHub push
    → GitHub Actions (test, lint, build, Docker verify)
    → Railway deploy (API)
    → Vercel auto-deploy (frontend)
```

---

## 21. Scalability path

| Phase | Customers | Infrastructure |
|-------|-----------|----------------|
| 1 | ~100 | Railway (1 service) |
| 2 | ~500 | Railway Pro + MongoDB M10 + Redis |
| 3 | 1,000+ | AWS ECS auto-scaling |
| 4 | 10,000+ | Dedicated AI workers |
| 5 | Enterprise | Dedicated infra, multi-region |

---

## 22. Future architecture

- AI workflow builder (visual)
- Multi-agent orchestration
- Voice AI pipeline
- WhatsApp / Slack / Teams adapters
- Plugin SDK + marketplace
- MCP server integration
- On-premise enterprise deployment
- Dedicated vector DB if MongoDB vector search limits reached

---

## 23. Engineering principles

1. **API-first** — build the API, then the UI
2. **Cloud-native** — managed services over self-hosted
3. **Multi-tenant** — isolation by default
4. **Modular** — clear module boundaries in NestJS
5. **AI-native** — AI layer is a platform, not an afterthought
6. **Developer experience** — great docs, SDKs, and playground
7. **Security by design** — not bolted on later
8. **Scalable by default** — stateless services, horizontal scaling
