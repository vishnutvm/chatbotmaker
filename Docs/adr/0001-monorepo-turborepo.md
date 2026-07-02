# ADR 0001: Turborepo Monorepo

**Status:** Accepted  
**Date:** 2026-07-02

## Context

ChatbotMaker includes marketing site, dashboard, API, widget, and shared packages. We need one repo strategy that supports MVP speed and 3–5 year scale.

## Options

1. **Multi-repo** — independent deploys, higher coordination cost
2. **Single Next.js app** — fast start, poor separation of marketing vs app vs API
3. **Turborepo monorepo** — shared tooling, atomic changes, clear app boundaries

## Decision

**Turborepo + pnpm workspaces** with `apps/` and `packages/`.

## Consequences

- Shared TypeScript, ESLint, and types across frontends and API client
- Single CI pipeline with Turborepo caching
- Requires disciplined module boundaries inside `apps/api`
- See [`Docs/07-repository-and-application-architecture.md`](../../Docs/07-repository-and-application-architecture.md)
