-- Formalize document_chunks FKs for assistant-scoped RAG.
-- knowledge_base_id = assistant_id; document_id = knowledge_source_id (MVP aliases).

-- Clear any orphan foundation rows before adding FKs (table unused until now).
TRUNCATE TABLE document_chunks;

ALTER TABLE document_chunks
  DROP CONSTRAINT IF EXISTS document_chunks_knowledge_base_id_fkey;

ALTER TABLE document_chunks
  DROP CONSTRAINT IF EXISTS document_chunks_document_id_fkey;

ALTER TABLE document_chunks
  ADD CONSTRAINT document_chunks_knowledge_base_id_fkey
  FOREIGN KEY (knowledge_base_id) REFERENCES assistants(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE document_chunks
  ADD CONSTRAINT document_chunks_document_id_fkey
  FOREIGN KEY (document_id) REFERENCES knowledge_sources(id) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS document_chunks_document_id_chunk_index_key
  ON document_chunks (document_id, chunk_index);
