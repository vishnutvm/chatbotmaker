# Assistants + Wizard Knowledge (MVP)

**Status:** Implemented (Assistants wizard + Phase 5 RAG ingest/retrieve)  
**Phases:** 6 (Assistants CRUD) + 5 (chunk/embed/pgvector retrieval for text/URL)  
**API:** `docs/api/assistants.md`  
**RAG:** `docs/architecture/RAG_ARCHITECTURE.md`

## What works end-to-end

1. **Create** — name + purpose → `POST …/assistants` (presets apply welcome/tone/instructions)
2. **Teach** — text paste or URL fetch → `POST …/knowledge` → chunk + embed into `document_chunks`
3. **Customize** — PATCH welcome/tone/instructions
4. **Test** — real OpenAI via `POST …/assistants/:id/chat` (vector retrieval + fallback dump)
5. **Deploy** — `POST …/deploy` → status `live`; list/overview from API

## Knowledge ingest

- New sources start as `pending` (HTTP returns immediately); background ingest flips to `ready` / `failed`
- Failed URL fetch → `failed` (no embed attempt)
- Chat prefers top-k similar chunks (min similarity 0.25); if none, falls back to truncated ready-source dump

## Out of scope (next)

- Website crawl / sitemap / file upload
- Public widget CDN (Phase 7) — see `docs/features/WIDGET.md` (`widget.js` foundation; CDN/UI deferred)
- Conversation persistence / inbox
- Shared multi-assistant knowledge bases

## Apply migrations

```bash
cd apps/api
npx prisma migrate deploy
```

Migrations:

- `20260716120000_assistants_knowledge`
- `20260716123000_document_chunks_rag_fks`
