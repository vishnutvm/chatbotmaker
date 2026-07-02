# Cursor AI Engineering System

Genie is built by an **AI engineering organization**, not a single coding assistant.

## Roles

| Role | Who |
|------|-----|
| **Product Owner & CTO** | Human (Vichu) — decides *what* |
| **AI CTO** | Lead agent — orchestrates SDLC |
| **Specialists** | Subagents in `.cursor/agents/` |

## Pipeline

```text
Product → Roadmap → Sprint → Architecture → Tasks → Implementation (20%)
→ Tests → Performance → Security → Refactor → Docs → DoD → Commit
```

## Primitives

| Type | Path |
|------|------|
| Rules | `.cursor/rules/*.mdc` |
| Subagents | `.cursor/agents/*.md` |
| Skills | `.cursor/skills/*/SKILL.md` |
| Notion config | `.cursor/notion.json` |
| Orchestration | `AGENTS.md` |

## Key skills

- `development-lifecycle` — full feature pipeline
- `sprint-planning` — sprint goals and deliverables
- `feature-implementation` — master playbook
- `api-contract-first` — API before code
- `continuous-refactoring` — every 5–10 features
- `notion-progress-tracking` — task sync

## Invoke specialists

`/product-owner` `/tech-lead` `/solution-architect` `/project-manager`  
`/backend-engineer` `/frontend-engineer` `/performance-reviewer` `/security-engineer`  
`/qa-engineer` `/code-reviewer` `/documentation-engineer`
