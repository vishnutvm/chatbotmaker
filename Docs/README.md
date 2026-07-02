# Genie — Living Knowledge Base

Engineering knowledge base for ChatbotMaker (Genie). **Update when features change.**

| Area | Location | Purpose |
|------|----------|---------|
| **Product (canonical)** | [`../Docs/`](../Docs/README.md) | Vision, roadmap, functional spec, infrastructure |
| **Architecture** | [`architecture/`](./architecture/README.md) | System design, module boundaries |
| **Business** | [`business/`](./business/README.md) | Product context for engineering |
| **API** | [`api/`](./api/README.md) | API contracts (define before implement) |
| **Database** | [`database/`](./database/README.md) | Schemas, indexes, migrations |
| **Features** | [`features/`](./features/README.md) | Per-feature implementation notes |
| **ADR** | [`adr/`](./adr/README.md) | Architecture Decision Records |
| **Development** | [`development/`](./development/README.md) | Cursor AI system, workflows, conventions |
| **Testing** | [`testing/`](./testing/README.md) | Test strategy and patterns |
| **Security** | [`security/`](./security/README.md) | Security standards and reviews |

## Rules

- API contracts go in `docs/api/` **before** backend implementation
- Significant architecture decisions get an ADR in `docs/adr/`
- Keep `Docs/` (product) and `docs/` (engineering) in sync when scope changes
- AI must update relevant sections on every completed feature

## Cursor AI system

See [`development/cursor-ai-system.md`](./development/cursor-ai-system.md) and [`.cursor/README.md`](../.cursor/README.md).
