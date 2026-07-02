---
name: development-lifecycle
description: Full feature lifecycle from requirement to merge. Use as the canonical step-by-step pipeline when implementing any feature or sprint task in Genie.
---

# Development Lifecycle

Every feature follows **exactly** this sequence. Writing code is ~20% of the work.

## Lifecycle

```text
1.  Requirement        → product-owner / human PO alignment
2.  Analysis           → modules, edge cases, hidden requirements
3.  Architecture       → solution-architect + tech-lead gates
4.  Task breakdown     → Notion tasks + sprint scope
5.  API contract       → api-contract-first (if API)
6.  DB review          → database-migration (if schema)
7.  UI plan            → ui-feature states (if frontend)
8.  Implementation     → specialist subagents
9.  Self review        → author checks own work
10. Unit tests
11. Integration tests
12. E2E tests          → qa-engineer
13. Performance review → performance-reviewer
14. Security review    → security-engineer
15. Refactor           → address review findings
16. Documentation      → documentation-engineer + docs/
17. Code review        → code-reviewer
18. Definition of done → definition-of-done.mdc
19. Notion Done        → notion-progress-tracking
20. Git commit         → when user requests
21. Merge              → when user requests PR
```

## Gate shortcuts

| If feature is... | Skip |
|------------------|------|
| Docs only | API, DB, UI gates |
| Config/CI only | API, DB, UI gates |
| UI only | API contract (unless new API needed) |
| API only | UI plan |

Never skip: requirement analysis, security mindset, tests (as applicable), code review, DoD.

## Skills map

| Step | Skill / Agent |
|------|----------------|
| Sprint scope | `sprint-planning` |
| Notion | `notion-progress-tracking` |
| API | `api-contract-first` |
| Module | `new-module` |
| Endpoint | `new-api-endpoint` |
| Schema | `database-migration` |
| UI | `ui-feature` |
| Master | `feature-implementation` |

## Human role

**You (human) = Product Owner + CTO.** Approve sprint goals and significant architecture. AI executes the pipeline.
