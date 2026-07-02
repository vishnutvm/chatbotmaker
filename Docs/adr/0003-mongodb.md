# ADR 0003: MongoDB Atlas

**Status:** Accepted  
**Date:** 2026-07-02

## Context

Genie stores organizations, users, assistants, knowledge metadata, vectors (Atlas Vector Search), and usage records.

## Options

1. **PostgreSQL + pgvector** — strong relational model, different team skill fit
2. **MongoDB Atlas** — flexible schema, native vector search, managed ops
3. **DynamoDB** — scale, but weaker ad-hoc querying for analytics

## Decision

**MongoDB Atlas** for primary data store with **Atlas Vector Search** for RAG.

## Consequences

- Repository pattern required; no business logic in queries
- Index design critical for cost and performance
- Transactions available for multi-document consistency where needed
- Redis for cache/session hot paths
