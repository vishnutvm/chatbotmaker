# GCP Cloud Run Migration (Compute Only)

**Scope:** Railway → Cloud Run for `apps/api` only.  
**Unchanged:** Vercel (`apps/web`), Supabase (PG + Auth + Storage + pgvector), OpenAI, Stripe, Cloudflare.  
**ADR:** [0003-api-host-cloud-run.md](../adr/0003-api-host-cloud-run.md)  
**Status:** Plan / proposed — production cutover not executed until PO says ship.  
**Dev host (active):** [GCP_CLOUD_RUN_DEV_SETUP.md](./GCP_CLOUD_RUN_DEV_SETUP.md) — Cloud Run for development.  
**Declined for now:** GCE VM ([GCP_VM_DEV_SETUP.md](./GCP_VM_DEV_SETUP.md) kept as reference only).

---

## Target topology

```text
Cloudflare (DNS/CDN)
        │
        ▼
   apps/web (Vercel)  ──►  apps/api NestJS (Cloud Run)
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         Supabase        OpenAI          Stripe
     PG + Auth + Storage + pgvector
```

---

## Why this is low risk

| Concern | Status |
|---------|--------|
| Docker image | Already production-ready ([`docker/Dockerfile`](../../docker/Dockerfile)) |
| Listen address | `0.0.0.0` + `PORT` ([`apps/api/src/main.ts`](../../apps/api/src/main.ts)) |
| Health | `GET /health` (excluded from global prefix); Dockerfile + Railway already use it |
| Railway SDK | None in runtime — only `railway.toml` + optional GHA deploy |
| Auth / DB | Stay on Supabase; env vars copy 1:1 |

---

## GCP resources (minimal)

| Resource | Purpose |
|----------|---------|
| GCP project | e.g. `genie-mvp` |
| Artifact Registry | Store API images (`genie-api`) |
| Cloud Run service | `genie-api` — region near users / Supabase (prefer same continent) |
| Secret Manager | Env secrets (DB, Supabase, OpenAI, Stripe) |
| Service account | Cloud Run runtime SA with `secretAccessor` |
| Cloud Build **or** GitHub Actions | Build + push + deploy on `main` |
| Custom domain (optional) | `api.<domain>` via Cloudflare → Cloud Run mapping |

**Do not add for this migration:** Cloud SQL, VPC Connector (unless Supabase IP allowlisting forces it), Load Balancer beyond Cloud Run’s managed HTTPS, GKE.

---

## Env parity (Railway → Cloud Run)

Copy from Railway production. Do **not** invent new auth/DB URLs.

| Variable | Notes |
|----------|--------|
| `NODE_ENV` | `production` |
| `PORT` | Cloud Run injects `PORT` — do not hardcode 4000 in service config |
| `DATABASE_URL` | Supabase **pooler** `:6543` + `?pgbouncer=true` |
| `DIRECT_URL` | Supabase **direct** `:5432` |
| `SUPABASE_URL` | `https://<ref>.supabase.co` (must match Vercel) |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret Manager |
| `CORS_ORIGINS` | Vercel prod + localhost for local debug if needed |
| `WEB_APP_URL` / `APP_WEB_URL` | Vercel URL |
| `OPENAI_API_KEY` | Secret Manager |
| `STRIPE_*` | When billing is live |
| `GIT_COMMIT_SHA` or build arg | Optional; Dockerfile already avoids baking `"unknown"` |

**Do not set** `SUPABASE_JWT_SECRET` on production for hosted Supabase (JWKS-only). Same rule as Railway today ([AUTH_DEPLOY_CHECKLIST.md](./AUTH_DEPLOY_CHECKLIST.md)).

---

## Cloud Run service settings (recommended MVP)

| Setting | Value | Why |
|---------|-------|-----|
| CPU / memory | 1 vCPU / 512Mi–1Gi | Nest + Prisma; raise if OOM |
| Concurrency | 40–80 | Tune after load |
| Min instances | `0` initially; `1` if cold starts hurt chat | Cost vs latency |
| Max instances | 5–10 | Cap cost |
| Request timeout | **300–3600s** as needed | SSE chat streams must not die at 60s default if long |
| Ingress | All (or internal + LB later) | Public API |
| Auth | Allow unauthenticated | JWT checked in Nest, not IAM |
| Health check | HTTP `/health` | Startup + liveness |

Validate SSE: Cloud Run supports streaming responses; confirm Nest SSE chat does not buffer the full body and that timeout ≥ worst-case stream.

---

## CI/CD target

Replace Railway Git integration with:

```text
push to main (paths: apps/api, docker, packages used by api)
  → CI (existing .github/workflows/ci.yml) must pass
  → Build docker/Dockerfile
  → Push to Artifact Registry
  → gcloud run deploy genie-api --image ... --region ...
```

Concrete change set when implementing:

| File | Action |
|------|--------|
| [`.github/workflows/deploy-api.yml`](../../.github/workflows/deploy-api.yml) | Replace Railway CLI with `gcloud` Auth + Artifact Registry + `run deploy` |
| [`railway.toml`](../../railway.toml) | Keep until cutover complete, then archive or delete |
| Docs: DEPLOYMENT_ARCHITECTURE, INFRASTRUCTURE_ARCHITECTURE, AUTH_DEPLOY_CHECKLIST, devops-engineering.mdc | Point API host to Cloud Run |

GHA secrets: `GCP_WORKLOAD_IDENTITY_PROVIDER` + `GCP_SERVICE_ACCOUNT` (preferred) or `GCP_SA_KEY` (less preferred).

---

## Cutover sequence

### Phase 0 — Preconditions

- [ ] GCP project + billing + budget alert
- [ ] Region chosen (document in ACCESS / this file)
- [ ] Artifact Registry repo created
- [ ] Secrets mirrored from Railway (checklist above)
- [ ] Local `docker build -f docker/Dockerfile` still passes CI docker-api job

### Phase 1 — Shadow deploy

- [ ] Deploy Cloud Run with same env as Railway
- [ ] `curl https://<cloud-run-url>/health` → 200
- [ ] `curl https://<cloud-run-url>/version` → expected
- [ ] Hit auth smoke against Cloud Run URL with a real Supabase JWT (session + onboard) **without** changing Vercel yet
- [ ] Run Playwright smoke/auth against temporary `NEXT_PUBLIC_API_URL` override if needed

### Phase 2 — Dual run

- [ ] Keep Railway live
- [ ] Optionally put Cloudflare or temporary DNS on API subdomain pointing to Cloud Run for internal testing

### Phase 3 — Production cutover (single window)

1. Set Cloud Run `CORS_ORIGINS` to production Vercel origin(s)
2. Update Vercel `NEXT_PUBLIC_API_URL` → Cloud Run URL (or `https://api.<domain>`)
3. Redeploy / invalidate Vercel so clients pick up new URL
4. Smoke: login → onboard → dashboard; one chat stream if AI enabled
5. Monitor Cloud Run logs + error rate 24–48h

### Phase 4 — Decommission Railway

- [ ] Confirm no traffic to Railway (logs empty / metrics)
- [ ] Disable Railway Git deploy + optional `ENABLE_RAILWAY_GHA_DEPLOY`
- [ ] Delete or pause Railway service
- [ ] Mark ADR 0003 **Accepted**
- [ ] Update Notion + ACCESS URLs

### Rollback (any phase)

1. Set Vercel `NEXT_PUBLIC_API_URL` back to Railway URL  
2. Ensure Railway still has correct secrets and is running  
3. Investigate Cloud Run failure offline  

Prisma migrations are **not** part of this cutover (same Supabase DB).

---

## Cost (order of magnitude)

| Item | MVP expectation |
|------|-----------------|
| Cloud Run | Often within free tier / few dollars at low QPS |
| Artifact Registry | Low (image storage) |
| Secret Manager | Cents–low dollars |
| Egress to Supabase / OpenAI | Same as today (API → external) |

MVP infra target remains **&lt; $30/mo** excluding OpenAI. Compute-only GCP should stay inside that if min-instances = 0.

Compare: Railway hobby/pro flat fee vs Cloud Run request+CPU-time. Prefer budget alerts day one.

---

## Security checklist

- [ ] No secrets in image or GitHub plaintext — Secret Manager only  
- [ ] Runtime SA least privilege (`secretAccessor`, no `owner`)  
- [ ] Cloud Run allow-unauthenticated is OK; Nest + Supabase JWT still enforce auth  
- [ ] `SUPABASE_URL` validation still rejects non-`*.supabase.co` in production  
- [ ] CORS locked to known Vercel origins  
- [ ] Audit: who can `gcloud run deploy` (CI SA only)

---

## Performance checklist

| Path | Target |
|------|--------|
| `GET /health` | &lt; 200ms warm |
| Auth session / onboard | Same as Railway (Supabase-bound) |
| Chat SSE | No premature disconnect; timeout ≥ stream |

If cold start &gt; ~2–3s hurts UX → set `min-instances=1` for production only.

---

## Explicitly deferred (not this migration)

- Cloud SQL / leaving Supabase Postgres  
- GCS / leaving Supabase Storage  
- Identity Platform / leaving Supabase Auth  
- Next.js on Cloud Run or Firebase Hosting  
- Memorystore Redis  
- Widget CDN on GCS — see `docs/deployment/WIDGET_CDN.md`  

---

## Acceptance criteria (Done when shipped)

- [ ] Production traffic on Cloud Run; Railway paused/removed  
- [ ] Vercel + CORS + AUTH checklist docs updated  
- [ ] Deploy workflow uses GCP, not Railway  
- [ ] E2E smoke + auth-api pass against production API URL  
- [ ] ADR 0003 Accepted; infra architecture docs match  
- [ ] Notion task Done  
