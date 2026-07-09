# ChatbotMaker (Genie Platform)

**Custom ChatGPT for your website** — monorepo powered by Turborepo + pnpm.

| | |
|---|---|
| **Code** | [github.com/vishnutvm/chatbotmaker](https://github.com/vishnutvm/chatbotmaker) |
| **Documentation** | [github.com/vishnutvm/chatbotmaker-docs](https://github.com/vishnutvm/chatbotmaker-docs) (private) |
| **Codename** | Genie |

---

## Quick start

```bash
pnpm install
pnpm dev
```

| App | URL | Package |
|-----|-----|---------|
| Marketing | http://localhost:3000 | `@genie/marketing` |
| Dashboard | http://localhost:3001 | `@genie/dashboard` |
| API | http://localhost:4000/health | `@genie/api` |

---

## Monorepo structure

```text
chatbotmaker/
├── apps/           # marketing, dashboard, api, widget
├── packages/       # types, ui, api-client, config
├── .cursor/        # AI engineering rules & skills (repo-local)
└── AGENTS.md       # Pointer to docs repo + Cursor entry
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Production build |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run tests |
| `pnpm typecheck` | TypeScript check |

---

## API (production)

| App | URL |
|-----|-----|
| **Marketing** | https://chatbotmaker-marketing.vercel.app |
| **Dashboard** | https://chatbotmaker-dashboard-seven.vercel.app |
| **API (Railway)** | https://genie-api-production-4bb3.up.railway.app |
| **API (Render fallback)** | https://genie-api-rsfy.onrender.com |

`NEXT_PUBLIC_API_URL` on dashboard → Railway URL. Full registry in **chatbotmaker-docs** → `ACCESS.md`.

---

## Documentation

Engineering docs live in `docs/` in this repo. Product specs, roadmaps, and access registry:

**https://github.com/vishnutvm/chatbotmaker-docs**

Key local docs:
- `docs/architecture/` — technical and infrastructure architecture
- `docs/database/` — PostgreSQL schema design
- `docs/adr/0001-adopt-supabase-data-platform.md` — infrastructure decision
- `docs/development/SUPABASE_MIGRATION_PLAN.md` — migration plan

## Stack (MVP)

| Layer | Technology |
|-------|------------|
| Database | Supabase PostgreSQL + Prisma |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Vectors | pgvector |
| API | NestJS on Railway |
| Frontends | Next.js on Vercel |

---

## Deploy

| App | Host | Root directory |
|-----|------|----------------|
| Marketing | Vercel | `apps/marketing` |
| Dashboard | Vercel | `apps/dashboard` |
| API | Railway (primary) / Render (fallback) | `docker/Dockerfile` |

Import this repo on Vercel; connect GitHub on Railway. See **chatbotmaker-docs** for URLs, SSH, and mirror setup.
