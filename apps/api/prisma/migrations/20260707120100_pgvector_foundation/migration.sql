-- pgvector foundation for RAG (Phase 5)
-- Applied when knowledge module is implemented

CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    knowledge_base_id UUID NOT NULL,
    document_id UUID NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    embedding vector(1536),
    embedding_model TEXT,
    embedding_version TEXT,
    token_count INTEGER,
    chunk_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS document_chunks_org_kb_idx
    ON document_chunks (organization_id, knowledge_base_id);

-- Uncomment when vector volume warrants approximate search:
-- CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
--     ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
