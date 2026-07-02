# Infrastructure & Deployment Blueprint

**Product:** ChatbotMaker (Genie)  
**Version:** 1.0  
**Status:** Active  
**Priority:** Critical  
**Document type:** Infrastructure Architecture Document (IAD)

---

## 1. Purpose

This document defines the **official infrastructure architecture** for the project.

Every feature, deployment, service, and architectural decision must follow this document.

Do not introduce additional infrastructure, cloud services, databases, or deployment patterns unless explicitly approved.

**Objective:** Keep infrastructure simple, cost-effective, scalable, and production-ready.

Related documents:

- [Technical architecture](./03-technical-architecture.md)
- [Repository & application architecture](./07-repository-and-application-architecture.md)
- [MVP roadmap](./05-mvp-roadmap.md)

---

## 2. Current development stage

| Item | Value |
|------|-------|
| Stage | MVP Development |
| Goal | Production-quality SaaS with infrastructure costs near zero during development |
| Focus | Fast iteration · Low cost · Clean architecture · Production-ready code · Easy migration to AWS |

---

## 3. Infrastructure philosophy

1. Build for simplicity.
2. Keep infrastructure costs minimal.
3. Do not over-engineer.
4. Design for future scalability.
5. Keep deployment automated.
6. Keep services loosely coupled.
7. Use managed services whenever possible.
8. Infrastructure must be cloud portable.
9. Development and production architectures should remain similar.
10. Avoid vendor lock-in whenever possible.

---

## 4. Official infrastructure

### Frontend

| Item | Value |
|------|-------|
| Platform | **Vercel Free** (MVP) |
| Framework | **Next.js** |
| Apps | `apps/marketing`, `apps/dashboard` |
| Responsibilities | Marketing, dashboard, auth UI, settings, assistant builder |
| Deployment | Automatic via GitHub |

### Backend

| Item | Value |
|------|-------|
| Platform | **Railway** (MVP) → AWS ECS (production migration) |
| Framework | **NestJS** |
| App | `apps/api` |
| Responsibilities | REST APIs, auth, organizations, assistants, knowledge, billing, analytics, conversations, AI integration |
| Deployment | Docker container · Railway auto deploy |

### Database

| Item | Value |
|------|-------|
| Platform | **MongoDB Atlas** |
| Cluster | Free tier (development) → M10 (Phase 2) |
| Responsibilities | Primary database, multi-tenant data, conversations, documents, billing, users, organizations |

### Cache

| Phase | Implementation |
|-------|----------------|
| Development | In-memory cache (`MemoryCacheProvider`) |
| Production | Redis Cloud |
| Rule | **Abstract cache behind an interface** — never tightly couple business logic to Redis |

### Storage

| Item | Value |
|------|-------|
| Platform | **AWS S3** |
| Development | AWS Free Tier |
| Responsibilities | PDFs, images, user uploads, exports, knowledge documents |

### AI provider

| Item | Value |
|------|-------|
| Provider | **OpenAI** (MVP) |
| Rule | Always use the **AI Service Layer** — never call OpenAI directly from controllers or business modules |
| Future | Anthropic, Gemini, OpenRouter, local models |

### Payments

| Item | Value |
|------|-------|
| Platform | **Stripe** |
| Responsibilities | Subscriptions, invoices, webhooks, usage billing |

### DNS / edge

| Item | Value |
|------|-------|
| Platform | **Cloudflare** |
| Responsibilities | DNS, SSL, CDN, security, caching |
| Future | WAF, rate limiting |

---

## 5. High-level architecture (MVP)

```text
                         Internet
                             │
                             ▼
                    Cloudflare (DNS / SSL / CDN)
                             │
            ┌────────────────┴────────────────┐
            │                                 │
            ▼                                 ▼
   Vercel (Marketing + Dashboard)      Widget CDN (future)
            │
            ▼
        Railway (NestJS API — Docker)
            │
   ┌────────┼────────────────────────────────────┐
   │        │         │          │        │      │
   ▼        ▼         ▼          ▼        ▼      ▼
  Auth    AI/RAG   Assistant  Knowledge Billing Analytics
  (single NestJS modular monolith in apps/api)
            │
            ▼
       Data & services
   ├── MongoDB Atlas (free → M10)
   ├── Memory cache → Redis Cloud
   ├── AWS S3
   ├── OpenAI (via AI service layer)
   └── Stripe
```

---

## 6. Repository structure

```text
genie-platform/
├── apps/
│   ├── marketing/          # Next.js — public site (SSR/SSG)
│   ├── dashboard/          # Next.js — authenticated app
│   ├── api/                # NestJS backend
│   └── widget/             # Embeddable chat bundle
├── packages/
│   ├── ui/
│   ├── types/
│   ├── config/
│   └── api-client/
├── docker/
│   └── Dockerfile          # API production image
├── .github/workflows/      # CI + deploy
├── railway.toml            # Railway service config
├── Docs/
└── scripts/
```

---

## 7. Development environment

| Tool | Purpose |
|------|---------|
| Node.js LTS | Runtime |
| pnpm | Package manager |
| Turborepo | Monorepo orchestration |
| Docker | API container builds |
| MongoDB Atlas | Database (dev cluster) |
| Railway CLI | API deployment |
| Vercel CLI | Frontend deployment |
| GitHub Actions | CI/CD |

---

## 8. Deployment pipeline

```text
Git push
    ↓
GitHub
    ↓
GitHub Actions
    ├── Lint
    ├── Typecheck
    ├── Test
    ├── Build (Turborepo)
    └── Docker build (API image verify)
    ↓
Deploy
    ├── API → Railway (auto deploy from main, or Actions + RAILWAY_TOKEN)
    └── Frontends → Vercel (auto deploy)
```

### Deployment map

| App | Host (MVP) | URL (target) | Trigger |
|-----|------------|--------------|---------|
| `apps/marketing` | Vercel | `chatbotmaker.com` | Push to `main` |
| `apps/dashboard` | Vercel | `app.chatbotmaker.com` | Push to `main` |
| `apps/api` | Railway | `api.chatbotmaker.com` | Push to `main` |
| `apps/widget` | Cloudflare CDN | `cdn.chatbotmaker.com` | Release tag |

### Railway setup (one-time)

1. Create Railway project and connect GitHub repo.
2. Add service using `docker/Dockerfile` (see `railway.toml`).
3. Set environment variables from `apps/api/.env.example`.
4. Configure custom domain via Cloudflare CNAME.
5. Optional: add `RAILWAY_TOKEN` to GitHub secrets for `deploy-api.yml`.

---

## 9. Environment variables

| Environment | Rule |
|-------------|------|
| Development | Local `.env` files (never committed) |
| Staging | Railway / Vercel env panels |
| Production | Railway / Vercel env panels + AWS for S3 |

**Never** hardcode secrets. **Never** commit `.env`.

See `apps/api/.env.example` for API variables.

---

## 10. Architecture rules

- Business logic belongs in the backend (`apps/api`).
- Frontend never contains business logic — only consumes APIs.
- Controllers remain thin; services contain business logic; repositories contain data access.
- Use dependency injection.
- Maintain module boundaries (auth, billing, AI, etc.).
- Abstract Redis, Railway, Vercel, and OpenAI for future AWS migration.

---

## 11. Development rules

Every new feature must consider **before implementation**:

- Architecture
- Security
- Performance
- Cloud cost
- Maintainability
- Scalability
- Testing
- Documentation

---

## 12. Scaling strategy

### MVP (current)

| Service | Tier |
|---------|------|
| Vercel | Free |
| Railway | Hobby / usage-based |
| MongoDB Atlas | Free |
| Cloudflare | Free |
| OpenAI | Pay-as-you-go |
| **Target** | **&lt; $30/month** infrastructure (excluding OpenAI usage) |

### Phase 2 (~100–500 customers)

| Service | Upgrade |
|---------|---------|
| MongoDB Atlas | M10 |
| Railway | Pro |
| Redis Cloud | Starter tier |
| Vercel | Pro (if needed) |

### Phase 3 (production hardening)

| Service | Upgrade |
|---------|---------|
| API hosting | AWS ECS Fargate |
| Storage | AWS S3 (production buckets) |
| Observability | CloudWatch |
| Email | AWS SES |
| Secrets | AWS Secrets Manager |

---

## 13. Future production migration

```text
Current (MVP)                    Future (production)
─────────────                    ───────────────────
Vercel                    →      Vercel
Railway                   →      AWS ECS
MongoDB Atlas (free/M10)  →      MongoDB Atlas (M10+)
Memory cache / Redis      →      Redis Cloud
S3                        →      S3
—                         →      CloudWatch
Cloudflare                →      Cloudflare
```

**Requirement:** Migration must require **minimal code changes**. All external services must be abstracted behind interfaces (cache, AI, storage, email).

---

## 14. Rules for engineering agents

| Do | Don't |
|----|-------|
| Code for AWS migration later | Recommend Kubernetes for MVP |
| Use AI service layer | Recommend microservices for MVP |
| Abstract Redis / cache | Introduce unnecessary cloud services |
| Use Docker for API | Replace NestJS, Next.js, or MongoDB |
| Keep costs under $30/mo in MVP | Bypass AI service layer |
| Deploy API to Railway (MVP) | Tightly couple code to Railway or Vercel |
| | Call OpenAI directly from controllers |

---

## 15. Definition of success

The infrastructure should:

- Be deployable in under 10 minutes
- Support 100+ customers
- Be maintainable by one developer
- Cost less than **$30/month** during MVP (excluding variable AI usage)
- Require **zero architecture rewrites** when migrating to AWS
- Remain modular and scalable
- Always optimize for simplicity first

---

## 16. Docker & CI/CD artifacts

| File | Purpose |
|------|---------|
| `docker/Dockerfile` | Multi-stage production image for `apps/api` |
| `.dockerignore` | Exclude dev artifacts from image context |
| `railway.toml` | Railway build and health-check config |
| `.github/workflows/ci.yml` | Lint, test, build, Docker verify |
| `.github/workflows/deploy-api.yml` | Optional Railway deploy via CLI |

---

*Last updated: July 2026*
