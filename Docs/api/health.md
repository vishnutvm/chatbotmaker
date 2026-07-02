# Health API

Sprint 1 foundation endpoint. Full API contracts live in `docs/api/` as features ship.

## GET /health

**Auth:** None (public)  
**Purpose:** Load balancer and local dev health check

### Response 200

```json
{
  "status": "ok",
  "service": "genie-api",
  "timestamp": "2026-07-02T12:00:00.000Z"
}
```

### Performance target

| Metric | Target |
|--------|--------|
| p95 latency | < 50ms |
| DB queries | 0 |

### Errors

None expected for healthy service. Non-200 indicates process failure.
