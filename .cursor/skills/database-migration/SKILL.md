---
name: database-migration
description: Playbook for MongoDB schema changes, indexes, and data migrations in apps/api. Use when adding collections, fields, indexes, or backfill scripts.
---

# Database Migration Playbook

## Steps

### 1. Document the change

```markdown
## Migration: [name]
**Date:**
**Phase:**

### Schema changes
- Collection:
- New fields:
- Removed fields:
- Indexes:

### Backfill required: yes | no
### Rollback plan:
```

### 2. Update schema

- Modify Mongoose schema / entity in `apps/api/src/modules/<module>/schemas/`
- Add validation rules

### 3. Add indexes

- Define in schema or migration script
- Match production query patterns

### 4. Update repository

- New query methods only — no business logic
- Use projection and pagination

### 5. Backfill (if needed)

- Idempotent script in `apps/api/scripts/` or migration folder
- Test on staging data first
- Log progress; support dry-run mode

### 6. Tests

- Integration tests for new queries
- Verify index usage where possible

### 7. Documentation

- Migration notes (how to run, rollback)
- Update database notes in docs

## Checklist

- [ ] No breaking change without deprecation period
- [ ] Indexes added for new query patterns
- [ ] Backfill tested in staging
- [ ] Rollback documented
- [ ] Repository has no business logic
- [ ] Integration tests pass
