# Authentication Architecture

**Last Updated:** 2026-07-07

---

## Principle

**Supabase Auth owns identity. NestJS owns application authorization.**

Do not build a duplicate username/password system in NestJS.

---

## Responsibility Split

| Concern | Owner |
|---------|-------|
| Registration | Supabase Auth |
| Login / logout | Supabase Auth |
| Email verification | Supabase Auth |
| Password reset | Supabase Auth |
| OAuth providers | Supabase Auth (future) |
| Access / refresh tokens | Supabase Auth |
| JWT validation | NestJS (`SupabaseJwtGuard`) |
| Application user record | NestJS + PostgreSQL |
| Organization provisioning | NestJS |
| RBAC / permissions | NestJS |
| API key authentication | NestJS (future) |
| Tenant isolation | NestJS + PostgreSQL |

---

## Authentication Flow

### Sign Up

```text
1. Web: supabase.auth.signUp({ email, password, options: { data: { name } } })
2. Supabase creates auth.users record
3. Web: POST /api/v1/auth/onboard
   Headers: Authorization: Bearer <supabase_access_token>
   Body: { name, email? }  — no company/workspace field in UI
4. NestJS validates JWT
5. NestJS creates users + organizations + organization_members (owner)
   Company name defaults to "{name}'s Company" (rename later in Settings)
6. Web stores Supabase session → /dashboard
```

Product rule: **one account ↔ one company**. Signup/onboarding does not ask for workspace/team/company name.

### Sign In

```text
1. Web: supabase.auth.signInWithPassword({ email, password })
2. Supabase returns session (access_token, refresh_token)
3. Web: GET /api/v1/auth/session — if not onboarded, auto-onboard from Google/profile name when possible, else /signup?onboard=1 (name only)
4. Else → /dashboard
```

### Google OAuth

```text
1. Web: supabase.auth.signInWithOAuth({ provider: 'google' })
2. /auth/callback exchanges code → session
3. GET /api/v1/auth/session → auto-onboard when display name available → /dashboard
```

### Token Refresh

Handled by Supabase client SDK (`autoRefreshToken: true`). NestJS does not issue refresh tokens.

### Protected API Requests

```text
Authorization: Bearer <supabase_access_token>
```

NestJS guard:
1. Validate JWT signature (JWKS or `SUPABASE_JWT_SECRET`)
2. Extract `sub` (Supabase user ID)
3. Load application user by `supabase_user_id`
4. Attach `userId`, `email` to request context
5. For org-scoped routes: verify membership

---

## JWT Validation

Supabase JWTs use asymmetric signing (ES256) in production. NestJS validates via:

- **JWKS endpoint:** `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`
- **Fallback:** `SUPABASE_JWT_SECRET` for HS256 (local/test)

Validated claims:
- `sub` — Supabase user ID (required)
- `exp` — Expiry (required)
- `aud` — Audience (optional check)

---

## Application User Mapping

```text
auth.users (Supabase)  ──1:1──  users (PostgreSQL)
  id (uuid)                    supabase_user_id (uuid, unique)
                               email, name, ...
```

On first API call after signup, if no application user exists, client must call `/auth/onboard`.

---

## API Endpoints (Phase 2)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/onboard` | Supabase JWT | Create app user + organization |
| GET | `/api/v1/auth/me` | Supabase JWT | Current user + organizations |
| PATCH | `/api/v1/auth/me` | Supabase JWT | Update profile name |
| DELETE | `/api/v1/auth/me` | Supabase JWT | Delete app user + company + Supabase auth identity |

Removed: `/auth/signup`, `/auth/login`, `/auth/refresh`, `/auth/logout` (handled by Supabase client).

Password reset and change-password for email accounts are handled by the Supabase client (`resetPasswordForEmail` / `updateUser`), not NestJS.

---

## Frontend Session Storage

Dashboard uses Supabase client session management. Access token retrieved via:

```typescript
const { data: { session } } = await supabase.auth.getSession();
const accessToken = session?.access_token;
```

---

## Security Requirements

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to frontend
- Validate JWT on every protected route
- Reject expired and malformed tokens
- Rate limit auth endpoints (future)
- Audit log sensitive auth events (future)

---

## Future: OAuth

Configure providers in Supabase dashboard. Onboard flow remains the same after first OAuth login.
