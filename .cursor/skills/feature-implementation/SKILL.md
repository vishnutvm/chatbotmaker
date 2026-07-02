---
name: feature-implementation
description: Master feature implementation playbook for Genie. Use for every feature — drives full lifecycle from requirement through reviews to Notion Done, not code-only.
---

# Feature Implementation Playbook

Use with `development-lifecycle` skill. **Do not skip steps.**

## Phase 0 — Align (human PO + AI)

- Confirm sprint goal or feature scope with Product Owner intent
- Search/create **Notion** task → `In progress`

## Phase 1 — Analyze & design (no code)

1. **Requirement analysis** — invoke `product-owner` pattern:
   - Problem, modules, edge cases, hidden requirements
2. **Architecture** — `solution-architect` + `tech-lead` gates
3. **API contract** — `api-contract-first` (if API)
4. **DB review** — `database-migration` plan (if schema)
5. **UI plan** — empty/loading/error/success/a11y (if UI)
6. **Cost & performance targets** — document before coding

Present plan to user for non-trivial work:

```markdown
## Feature: [name]
**Sprint / Phase:** ...
**Notion:** [link]

### Acceptance criteria
- [ ] ...

### Review gates
- [ ] Architecture  - [ ] Cost  - [ ] Security plan  - [ ] Performance targets

### API contract
(link or N/A)

### Changes
| Area | Files | Action |

### Testing plan
Unit / Integration / E2E

### Risks
```

## Phase 2 — Implement (~20% of effort)

Delegate to specialists. Follow file-scoped rules.

## Phase 3 — Test

Unit → Integration → E2E (`qa-engineer`)

## Phase 4 — Review

1. Self-review
2. `performance-reviewer` (API/hot paths)
3. `security-engineer`
4. Refactor if needed
5. `code-reviewer`

## Phase 5 — Document

- `documentation-engineer`
- Update `docs/` and `Docs/` as applicable
- ADR in `docs/adr/` if architectural decision

## Phase 6 — Complete

1. All `definition-of-done.mdc` criteria
2. Notion → `Done`
3. Git commit only when user requests
