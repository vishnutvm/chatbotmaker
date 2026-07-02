# Genie Platform — AI Engineering Organization

Cursor operates as a **full AI engineering company**. The human is **Product Owner + CTO**. AI executes the SDLC pipeline.

## Structure

```text
.cursor/
├── notion.json     # Notion workspace IDs
├── rules/          # 20 rules (always-on + file-scoped)
├── agents/         # 14 specialist subagents
└── skills/         # 9 playbooks
docs/               # Living knowledge base + ADRs
Docs/               # Product docs (canonical)
AGENTS.md           # Orchestration index
```

## AI organization

```text
Human (Product Owner + CTO)
         │
      AI CTO (lead rules + AGENTS.md)
         │
    ┌────┼────┬────────────┐
    ▼    ▼    ▼            ▼
product-  solution-  project-    tech-lead
owner     architect  manager     (review gates)
              │
    ┌─────────┼─────────┬──────────┐
    ▼         ▼         ▼          ▼
 backend  frontend  ai-rag    database
 devops   qa        security  performance-reviewer
 code-reviewer  documentation-engineer
```

## Development pipeline

```text
Product → Roadmap → Sprint → Architecture → Tasks (Notion)
→ Implementation (20%) → Tests → Performance → Security
→ Refactor → Docs/ADR → DoD → Commit
```

**Lifecycle skill:** `development-lifecycle`  
**Sprint skill:** `sprint-planning`

## Rules (always apply — key)

| Rule | Purpose |
|------|---------|
| `lead-software-architect.mdc` | AI CTO mindset |
| `think-first.mdc` | Never code before design |
| `development-pipeline.mdc` | Product → sprint → merge |
| `review-gates.mdc` | Architecture, cost, security, perf, DB, UI, API |
| `development-workflow.mdc` | 10-step pre-code workflow |
| `definition-of-done.mdc` | Full production checklist |
| `notion-tracking.mdc` | Notion task sync |
| + architecture, security, performance, cost, testing, docs, phases |

## Subagents (14)

| Agent | Role |
|-------|------|
| `product-owner` | Requirements, acceptance criteria |
| `project-manager` | Sprints, Notion, roadmap |
| `solution-architect` | Design, ADRs |
| `tech-lead` | Review gates, standards |
| `backend-engineer` | NestJS |
| `frontend-engineer` | Next.js |
| `ai-rag-engineer` | LLM, RAG |
| `database-engineer` | MongoDB |
| `devops-engineer` | CI/CD, infra |
| `qa-engineer` | Tests |
| `security-engineer` | Security audit (read-only) |
| `performance-reviewer` | Perf/cost audit (read-only) |
| `code-reviewer` | Pre-merge review (read-only) |
| `documentation-engineer` | Docs + ADRs |

## Skills (9)

| Skill | Use |
|-------|-----|
| `development-lifecycle` | Full feature pipeline |
| `sprint-planning` | Sprint goals and deliverables |
| `feature-implementation` | Master playbook |
| `api-contract-first` | API before code |
| `continuous-refactoring` | Every 5–10 features |
| `notion-progress-tracking` | Notion sync |
| `new-module` / `new-api-endpoint` / `database-migration` / `ui-feature` | Specialized tasks |

## Notion

[Engineering Hub](https://app.notion.com/p/391d48599a9981739d54d95dca415f29) · Genie Phases · Genie Tasks

## Knowledge base

`docs/` — architecture, api, adr, testing, security, development  
`docs/adr/` — ADR 0001–0007 (accepted + proposed)

## Typical sprint flow

1. `sprint-planning` — goal, tasks, deliverable
2. Notion tasks → In progress
3. `development-lifecycle` per task
4. `tech-lead` gates → specialists implement
5. `performance-reviewer` + `security-engineer` + `code-reviewer`
6. Docs + ADR → Notion Done
