# ADR 0006: Widget Embed Architecture

**Status:** Proposed  
**Date:** 2026-07-02

## Context

Customers embed chat on third-party sites via a small script.

## Options

1. **iframe only** — isolation, styling limitations
2. **JS bundle + shadow DOM** — smaller, style control, more integration work
3. **Full React app on customer page** — heavy bundle

## Decision (proposed)

**Minimal `widget.js` bundle** in `apps/widget/`, hosted on CDN (Cloudflare). API key auth to backend. Light/dark themes.

## Consequences

- Strict bundle size budget
- CORS and API key security critical
- No business logic in widget — API only
- Phase 7 per roadmap
