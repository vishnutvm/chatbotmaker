---
name: continuous-refactoring
description: Periodic codebase health review after every 5-10 completed features. Use to reduce duplication, improve architecture, and update docs without adding new features.
---

# Continuous Refactoring Sprint

Run every **5–10 completed features** (or when tech debt is flagged).

## Rules

- **Do not add new features** during this sprint
- Focus on maintainability, not new capability
- Update documentation and ADRs if architecture changes

## Review checklist

### Architecture
- [ ] Layering violations (logic in controllers, frontend, repos)
- [ ] Module boundary leaks (auth/billing/AI coupled incorrectly)
- [ ] Duplicate abstractions that should merge

### Code quality
- [ ] Duplicated code → extract shared utilities/services
- [ ] Naming clarity across modules
- [ ] Dead code removal
- [ ] Magic strings → config/constants

### Performance
- [ ] N+1 queries
- [ ] Missing indexes
- [ ] Cache opportunities
- [ ] Token/cost optimization in AI paths

### Tests
- [ ] Flaky tests fixed
- [ ] Missing coverage on critical paths
- [ ] Test utilities consolidated

### Documentation
- [ ] `docs/` and `Docs/` still accurate
- [ ] ADRs added for any undocumented decisions
- [ ] API docs match implementation

## Output

```markdown
## Refactoring Sprint Report

### Changes made
- ...

### Tech debt remaining (prioritized)
1. ...

### Metrics
- Files changed:
- Duplication removed:
- Tests added/fixed:
```

Track as a Notion task: Area=DevOps, Phase=current.
