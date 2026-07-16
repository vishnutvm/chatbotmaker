# Version / build identity

Use these endpoints to confirm which deploy is live after pushing to `main`.

| Surface | URL |
|---------|-----|
| Frontend page | https://chatbotmaker-dev.vercel.app/version |
| API JSON | https://genie-api-production-4bb3.up.railway.app/version |

Payload fields: `service`, `version`, `gitSha`, `gitShaShort`, `environment`, `nodeEnv`, `timestamp`.

Railway injects `RAILWAY_GIT_COMMIT_SHA`. Vercel injects `VERCEL_GIT_COMMIT_SHA` into the server page.
