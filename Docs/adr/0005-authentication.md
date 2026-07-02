# ADR 0005: Authentication Approach

**Status:** Proposed  
**Date:** 2026-07-02

## Context

Multi-tenant SaaS requires secure auth for dashboard API and widget (API keys).

## Options

1. **Session cookies only** — simple browser, harder for API/widget
2. **JWT access + refresh tokens** — stateless API, Redis for refresh/revocation
3. **Third-party auth only (Auth0)** — faster, ongoing cost and vendor lock-in

## Decision (proposed)

**JWT access + refresh tokens** for dashboard. **API keys** (`pk_live_...`) for widget. Google OAuth as secondary login. Email/password with verification.

## Consequences

- Auth isolated in dedicated module
- Tenant ID from JWT only in services
- Rate limiting on auth endpoints
- Implement in Phase 2 per roadmap
