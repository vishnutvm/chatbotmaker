# Assistants + Wizard Knowledge (MVP)

**Status:** Implemented on `feat/assistants-wizard-e2e`  
**Phases:** 6 (Assistants CRUD) + Phase 5 MVP knowledge (text/url, no embeddings yet)  
**API:** `docs/api/assistants.md`

## What works end-to-end

1. **Create** — name + purpose → `POST …/assistants` (presets apply welcome/tone/instructions)
2. **Teach** — text paste or URL fetch → `POST …/knowledge`
3. **Customize** — PATCH welcome/tone/instructions
4. **Test** — real OpenAI via `POST …/assistants/:id/chat` (system prompt + knowledge)
5. **Deploy** — `POST …/deploy` → status `live`; list/overview from API

## Out of scope (next)

- Website crawl / sitemap / file upload + chunk/embed/pgvector retrieval
- Public widget CDN (Phase 7) — snippets are placeholders with real assistant ids
- Conversation persistence / inbox

## Apply migration

```bash
cd apps/api
npx prisma migrate deploy
```

Migration: `20260716120000_assistants_knowledge`
