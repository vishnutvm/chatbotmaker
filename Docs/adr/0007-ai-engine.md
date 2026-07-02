# ADR 0007: AI Engine Module Design

**Status:** Proposed  
**Date:** 2026-07-02

## Context

Platform needs LLM calls, prompt assembly, streaming, and multi-provider readiness.

## Options

1. **Direct OpenAI calls from controllers** — fast, unmaintainable
2. **Internal AI module with provider abstraction** — testable, swappable
3. **Separate AI microservice** — premature for MVP

## Decision (proposed)

**Internal `ai/` module** with provider interface. OpenAI first. SSE streaming. Token budgets enforced in service layer.

## Consequences

- All AI logic isolated from controllers and frontends
- Cost optimization via model selection and context trimming
- Mock provider for tests
- Phase 4 per roadmap
