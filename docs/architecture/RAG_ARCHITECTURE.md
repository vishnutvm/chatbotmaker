# RAG Architecture

**Last Updated:** 2026-07-07  
**Implementation Phase:** 5 (Knowledge)

---

## Pipeline

```text
Document Upload
    |
    v
Supabase Storage
    |
    v
Document Processing (background job)
    |
    v
Text Extraction (PDF/DOCX/TXT/MD)
    |
    v
Text Normalization
    |
    v
Chunking (configurable size/overlap)
    |
    v
Embedding Generation (AIProvider.embed)
    |
    v
PostgreSQL + pgvector (document_chunks)
    |
    v
Vector Similarity Search (tenant-filtered)
    |
    v
Context Construction
    |
    v
LLM Generation (AIProvider.chat / stream)
    |
    v
Response
```

---

## document_chunks Table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | Tenant isolation (FK) |
| knowledge_base_id | uuid | Knowledge scope (FK) |
| document_id | uuid | Source document (FK) |
| content | text | Chunk text |
| metadata | jsonb | Page, section, source offsets |
| embedding | vector(1536) | pgvector embedding |
| embedding_model | text | e.g. text-embedding-3-small |
| embedding_version | text | Model version tag |
| token_count | int | Chunk token count |
| chunk_index | int | Order within document |
| created_at | timestamptz | |
| updated_at | timestamptz | |

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
3. At low volume (< 100K chunks): sequential scan acceptable with tenant filter
4. At scale: add IVFFlat or HNSW index on `embedding` column

---

## Embedding Model

Default: OpenAI `text-embedding-3-small` (1536 dimensions).

Configured via environment; tracked in `embedding_model` and `embedding_version` columns for re-indexing.

---

## Re-indexing

When embedding model changes:
1. Mark knowledge base as `reindexing`
2. Background job regenerates embeddings
3. Atomic swap or versioned queries during transition

---

## Security

- Cross-tenant vector retrieval must be impossible
- Integration tests required for tenant isolation on vector queries
- Document access authorized before retrieval context included in prompt

---

## Cost Considerations

- Cache embeddings; never re-embed unchanged chunks
- Batch embedding API calls where possible
- Limit chunk count per knowledge base on free tier
