---
name: sprint-planning
description: Sprint planning for Genie development. Use when scoping a sprint with goal, tasks, deliverable, tests, and Notion tracking — instead of vague "build X" requests.
---

# Sprint Planning Playbook

Scope work as **sprints**, not open-ended features.

## Sprint template

```markdown
## Sprint [N]: [Name]

**Goal:** [One sentence — what we achieve]
**Roadmap phase:** [1–10]
**Duration:** [estimate]

### Deliverable
[Production-ready artifact — e.g. "Auth system with JWT + Google OAuth"]

### Tasks (ordered)
1. [ ] Task — Notion link — Owner area
2. [ ] ...

### Review gates (pre-code)
- [ ] Requirement analysis (`product-owner`)
- [ ] Architecture (`solution-architect`)
- [ ] API contracts defined
- [ ] DB schema reviewed
- [ ] Cost/performance targets set

### Tests required
- [ ] Unit
- [ ] Integration
- [ ] E2E (flows: ...)

### Documentation
- [ ] API docs
- [ ] ADR (if architectural decision)
- [ ] README / migration notes

### Definition of done
- [ ] All tasks Done in Notion
- [ ] All tests pass
- [ ] Security + performance review
- [ ] Code review complete
```

## Workflow

1. Align sprint goal with human Product Owner
2. Break into tasks in **Notion Genie Tasks** (link to Phase)
3. Order tasks by dependency
4. State explicit **deliverable** and **out of scope**
5. Run sprint — one task at a time through full lifecycle (`feature-implementation` skill)
6. Sprint retrospective note in Notion (optional)

## Example

**Bad:** "Build authentication."

**Good:**

```text
Sprint 1 — Foundation + Auth shell
Goal: Production-ready auth API + login UI
Tasks: monorepo, apps/api auth module, JWT, Google OAuth, login page
Deliverable: User can register, login, access protected dashboard route
Tests: unit (auth service), integration (auth API), E2E (login flow)
```

## Notion

Create sprint tasks in Genie Tasks. Use Phase relation from `.cursor/notion.json`.
