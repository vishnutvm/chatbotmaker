# Auth — Profile & Account

## PATCH /api/v1/auth/me

Update the authenticated user's display name.

**Auth:** Bearer Supabase JWT (onboarded user)

### Request

```json
{ "name": "Ada Lovelace" }
```

| Field | Type | Rules |
|-------|------|--------|
| `name` | string | required, 1–100 chars |

### Response `200`

Same shape as `GET /api/v1/auth/me` (`MeResponse`).

### Errors

| Status | When |
|--------|------|
| 400 | Validation failed |
| 401 | Missing/invalid token or user not found |

---

## DELETE /api/v1/auth/me

Permanently deletes the application user, owned company (organization + memberships), and the Supabase Auth identity via service role.

**Auth:** Bearer Supabase JWT (onboarded user)

### Response `204`

Empty body.

### Errors

| Status | When |
|--------|------|
| 401 | Missing/invalid token or user not found |
| 500 | App data deleted but Supabase Auth delete failed |

### Notes

- Password change and forgot-password remain client-side Supabase Auth flows (email identity only).
- Change password UI is shown only for accounts with an `email` identity provider.
- Account delete removes Supabase Auth first, then app rows. MVP refuses delete if an owned company has other members.
- Prefer sole-owner companies (1 account = 1 company).
