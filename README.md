# ChatbotMaker (Genie Platform)

**Custom ChatGPT for your website** — monorepo powered by Turborepo + pnpm.

| | |
|---|---|
| **Live site** | [aichatbotmaker.vercel.app](https://aichatbotmaker.vercel.app) |
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
genie-platform/
├── apps/
│   ├── marketing/     # Landing page (SSR/SSG)
│   ├── dashboard/     # Authenticated app shell
│   ├── api/           # NestJS backend
│   └── widget/        # Embeddable bundle
├── packages/
│   ├── types/         # Shared TypeScript types
│   ├── ui/            # Shared UI components
│   ├── api-client/    # Typed API client
│   └── config/        # Shared TS configs
├── Docs/              # Product documentation
├── .cursor/           # AI engineering system
└── AGENTS.md          # AI CTO orchestration
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

## Documentation

- [Product docs](./Docs/README.md)
- [MVP Roadmap](./Docs/05-mvp-roadmap.md)
- [Architecture ADR](./Docs/07-repository-and-application-architecture.md)
- [Sprint 1 — Foundation](./Docs/features/sprint-1-foundation.md)
- [AI engineering system](./Docs/development/cursor-ai-system.md)

---

## Deploy on Vercel

This is a **pnpm monorepo**. Create **separate Vercel projects** per app:

| Vercel project | Root directory | Domain (suggested) |
|----------------|----------------|--------------------|
| Marketing | `apps/marketing` | chatbotmaker.com |
| Dashboard | `apps/dashboard` | app.chatbotmaker.com |

1. Import **https://github.com/vishnutvm/chatbotmaker** on [Vercel](https://vercel.com/new)
2. Set **Root Directory** to `apps/marketing` (or `apps/dashboard`)
3. Framework: **Next.js** (auto-detected)
4. Install command: `cd ../.. && pnpm install` (or use defaults from `vercel.json`)
5. Deploy

The API (`apps/api`) deploys to **AWS ECS** later — not Vercel.

---
