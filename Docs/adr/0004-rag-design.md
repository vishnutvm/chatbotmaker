# ADR 0004: RAG Pipeline Design

**Status:** Proposed  
**Date:** 2026-07-02

## Context

Users upload documents and URLs; assistants must answer with retrieved context and citations.

## Options

1. **Inline retrieval in chat handler** — simple, hard to test and scale
2. **Dedicated RAG module** — ingest, chunk, embed, retrieve as separate pipeline
3. **External vector DB only** — extra vendor, split brain with MongoDB

## Decision (proposed)

**Dedicated `rag/` and `knowledge/` modules** in NestJS. Embeddings in MongoDB Atlas Vector Search. Background jobs for ingestion.

## Consequences

- Ingestion must not block HTTP requests
- Cache embeddings for unchanged documents
- Token budget management in AI module
- Implement in Phase 5 per roadmap
