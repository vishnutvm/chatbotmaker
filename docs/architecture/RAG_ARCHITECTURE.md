# RAG Architecture

**Last Updated:** 2026-07-16  
**Implementation Phase:** 5 (Knowledge)

---

## MVP status (shipped)

Phase 5 MVP wires **assistant-scoped** RAG for text + URL knowledge:

1. `POST …/knowledge` creates a `knowledge_sources` row (`pending`)
2. `RagIngestionService` chunks content → `AiService.embed` → inserts `document_chunks`
3. Status → `ready` | `failed`
4. Assistant chat embeds the latest user message → tenant-filtered similarity search → prompt context
5. If no chunks: **fallback** to truncated dump of ready source contents (pre-RAG behavior)

**Out of scope for this MVP:** file upload, site crawl/sitemap, separate `knowledge_bases` tables, HNSW/IVFFlat indexes, background re-index jobs.

---

## MVP ID aliases

| `document_chunks` column | MVP meaning | FK target |
|--------------------------|-------------|-----------|
| `knowledge_base_id` | Assistant scope | `assistants.id` |
| `document_id` | Knowledge source | `knowledge_sources.id` |
| `organization_id` | Tenant | `organizations.id` |

Do not invent separate knowledge-base rows until product requires multi-assistant shared corpora.

---

## Pipeline

```text
Knowledge source (text paste | URL fetch)
    |
    v
Chunking (apps/api/src/modules/rag/chunking.ts)
    |
    v
Embedding (AiService.embed → AIProvider.embed, text-embedding-3-small)
    |
    v
PostgreSQL + pgvector (document_chunks)
    |
    v
Query embed + similarity search (org + assistant filters)
    |
    v
Context construction (bounded char budget)
    |
    v
LLM generation (assistant chat / AiService.complete)
```

Future (full Phase 5+): Document Upload → Storage → extraction → same chunk/embed path.

---

## document_chunks Table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | Tenant isolation (FK) |
| knowledge_base_id | uuid | MVP: assistant_id (FK) |
| document_id | uuid | MVP: knowledge_source_id (FK) |
| content | text | Chunk text |
| metadata | jsonb | sourceName, type, chunkIndex |
| embedding | vector(1536) | pgvector embedding |
| embedding_model | text | e.g. text-embedding-3-small |
| embedding_version | text | Model version tag |
| token_count | int | Chunk token count |
| chunk_index | int | Order within document |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Unique: `(document_id, chunk_index)`.

---

## Vector Search Query Pattern

```sql
SELECT id, content, metadata,
       1 - (embedding <=> $1::vector) AS similarity
FROM document_chunks
WHERE organization_id = $2
  AND knowledge_base_id = $3
ORDER BY embedding <=> $1::vector
LIMIT $4;
```

**Critical:** Always filter by `organization_id` AND `knowledge_base_id`. Never query vectors without tenant filters.

---

## Indexing Strategy (MVP)

1. Enable `pgvector` extension
2. B-tree indexes on `(organization_id, knowledge_base_id)`
3. Unique index on `(document_id, chunk_index)`
4. At low volume (< 100K chunks): sequential scan acceptable with tenant filter
5. At scale: add IVFFlat or HNSW index on `embedding` column

---

## Embedding Model

Default: OpenAI `text-embedding-3-small` (1536 dimensions).

Configured via `AI_EMBEDDING_MODEL`; tracked in `embedding_model` and `embedding_version` for future re-indexing.

Batch size on ingest: 16 texts per `AiService.embed` call.

---

## Module layout

| Piece | Path |
|-------|------|
| RagModule | `apps/api/src/modules/rag/rag.module.ts` |
| Chunking | `chunking.ts` |
| Repository | `document-chunks.repository.ts` |
| Ingest | `rag-ingestion.service.ts` |
| Retrieve | `rag-retrieval.service.ts` |
| Wire-in | `AssistantsService.addKnowledge` / `chat` |

---

## Re-indexing (future)

When embedding model changes:
1. Mark sources for reindex
2. Background job regenerates embeddings
3. Atomic swap or versioned queries during transition

---

## Security

- Cross-tenant vector retrieval must be impossible (org + assistant filters)
- Knowledge URL fetch: SSRF guards (no private hosts, no redirects)
- Document access authorized via org membership before retrieval context is included

---

## Cost Considerations

- Cache embeddings; never re-embed unchanged chunks (delete-by-source then re-insert on ingest)
- Batch embedding API calls (size 16)
- Bound prompt context (`RAG_PROMPT_CHAR_BUDGET` / dump budget 12k chars)
- Cap knowledge content length on ingest (100k chars)
