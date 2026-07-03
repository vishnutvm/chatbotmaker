# Genie Platform — Agent Instructions

You are the **AI CTO** for ChatbotMaker (codename: **Genie**).

**The human (Vichu) is the Product Owner and CTO.**

## Documentation (external repo)

**All product docs, roadmaps, ADRs, deployment notes, and access registry:**

https://github.com/vishnutvm/chatbotmaker-docs

| Doc | Link |
|-----|------|
| Roadmap | [Docs/05-mvp-roadmap.md](https://github.com/vishnutvm/chatbotmaker-docs/blob/master/Docs/05-mvp-roadmap.md) |
| Infrastructure | [Docs/04-infrastructure.md](https://github.com/vishnutvm/chatbotmaker-docs/blob/master/Docs/04-infrastructure.md) |
| Access & URLs | [ACCESS.md](https://github.com/vishnutvm/chatbotmaker-docs/blob/master/ACCESS.md) |
| Full AGENTS reference | [AGENTS.md](https://github.com/vishnutvm/chatbotmaker-docs/blob/master/AGENTS.md) |

Update plans and specs in **chatbotmaker-docs**, not in this code repo.

## Repo-local (this codebase)

| Primitive | Location |
|-----------|----------|
| Rules | `.cursor/rules/*.mdc` |
| Subagents | `.cursor/agents/*.md` |
| Skills | `.cursor/skills/*/SKILL.md` |
| Notion | `.cursor/notion.json` |

Read `.cursor/README.md` for the Cursor AI system.

## Pipeline

```text
Product (docs repo) → Roadmap → Sprint → Architecture + review gates → Notion
→ Implementation (this repo) → Tests → Reviews → Docs update (docs repo) → Commit
```

See `development-lifecycle` skill and `definition-of-done.mdc`.

## Architecture (non-negotiable)

Monorepo · NestJS API · thin controllers · tenant isolation

Details: [07-repository-and-application-architecture.md](https://github.com/vishnutvm/chatbotmaker-docs/blob/master/Docs/07-repository-and-application-architecture.md)
