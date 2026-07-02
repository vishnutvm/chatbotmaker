# ADR 0002: Dedicated NestJS Backend

**Status:** Accepted  
**Date:** 2026-07-02

## Context

Backend must serve dashboard, widget, and future SDKs with auth, RAG, billing, and multi-tenancy.

## Options

1. **Next.js API routes** — colocated with dashboard, couples frontend and backend
2. **NestJS modular monolith** — structured modules, DI, enterprise patterns
3. **Microservices day one** — premature operational complexity

## Decision

**NestJS modular monolith** in `apps/api/`. Not Next.js API routes.

## Consequences

- Clear layering: controller → service → repository
- Deploy on Railway (MVP) separately from Vercel frontends; migrate to AWS ECS without code rewrites
- AI/RAG as internal modules first, not separate services
- See [`Docs/03-technical-architecture.md`](../../Docs/03-technical-architecture.md)
