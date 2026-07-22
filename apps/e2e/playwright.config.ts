import { defineConfig, devices } from '@playwright/test';

function readEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}

const dashboardPort = process.env.E2E_DASHBOARD_PORT ?? '3000';
const apiPort = process.env.E2E_API_PORT ?? '4000';
const dashboardUrl = process.env.E2E_DASHBOARD_URL ?? `http://localhost:${dashboardPort}`;
const apiUrl = process.env.E2E_API_URL ?? `http://localhost:${apiPort}`;

const supabaseConfigured = Boolean(
  readEnv('E2E_SUPABASE_URL') && readEnv('E2E_SUPABASE_ANON_KEY'),
);

/** Shared CI/test HS256 secret — must match apps/e2e/tests/helpers/test-jwt.ts */
const e2eJwtSecret =
  readEnv('E2E_JWT_SECRET') ??
  readEnv('SUPABASE_JWT_SECRET') ??
  'ci-test-jwt-secret-minimum-32-characters';

/**
 * API JWT verification follows SUPABASE_URL, not the web client's Supabase project.
 * auth-api (synthetic HS256): localhost unless E2E_API_SUPABASE_URL is set.
 * auth-flow (real Supabase JWTs): set E2E_API_SUPABASE_URL to the hosted project in CI.
 */
const apiSupabaseUrl =
  readEnv('E2E_API_SUPABASE_URL') ??
  readEnv('SUPABASE_URL') ??
  'http://127.0.0.1:54321';

// Expose to Playwright test workers (webServer child env is not inherited by tests).
process.env.E2E_JWT_SECRET = e2eJwtSecret;
process.env.E2E_API_SUPABASE_URL = apiSupabaseUrl;

const apiServerEnv = {
  ...process.env,
  PORT: apiPort,
  NODE_ENV: 'test',
  DATABASE_URL:
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@127.0.0.1:5432/genie_ci',
  DIRECT_URL:
    process.env.DIRECT_URL ??
    'postgresql://postgres:postgres@127.0.0.1:5432/genie_ci',
  SUPABASE_URL: apiSupabaseUrl,
  SUPABASE_JWT_SECRET: e2eJwtSecret,
  CORS_ORIGINS:
    process.env.CORS_ORIGINS ??
    `http://localhost:${dashboardPort},http://127.0.0.1:${dashboardPort}`,
};

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['html']],
  timeout: 60_000,
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'web',
      testMatch: /(smoke|auth-guards|create-assistant|embed-snippet)\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: dashboardUrl,
      },
    },
    {
      name: 'full-stack',
      testMatch: /(auth-api|auth-flow|embed-snippet)\.spec\.ts/,
      timeout: 120_000,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: dashboardUrl,
      },
    },
  ],
  webServer:
    process.env.E2E_SKIP_WEBSERVER === 'true'
      ? undefined
      : process.env.E2E_WEB_ONLY === 'true'
        ? [
            {
              command: 'pnpm --filter @genie/web start',
              url: dashboardUrl,
              reuseExistingServer: !process.env.CI,
              timeout: 120_000,
              env: {
                ...process.env,
                NEXT_PUBLIC_API_URL: apiUrl,
                NEXT_PUBLIC_SUPABASE_URL: readEnv('E2E_SUPABASE_URL') ?? 'http://127.0.0.1:54321',
                NEXT_PUBLIC_SUPABASE_ANON_KEY:
                  readEnv('E2E_SUPABASE_ANON_KEY') ?? 'public-anon-key',
              },
            },
          ]
        : [
          {
            command: 'pnpm --filter @genie/api start',
            url: `${apiUrl}/health`,
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
            env: apiServerEnv,
          },
            {
              command: 'pnpm --filter @genie/web start',
              url: dashboardUrl,
              reuseExistingServer: !process.env.CI,
              timeout: 120_000,
              env: {
                ...process.env,
                NEXT_PUBLIC_API_URL: apiUrl,
                NEXT_PUBLIC_SUPABASE_URL: readEnv('E2E_SUPABASE_URL') ?? 'http://127.0.0.1:54321',
                NEXT_PUBLIC_SUPABASE_ANON_KEY:
                  readEnv('E2E_SUPABASE_ANON_KEY') ?? 'public-anon-key',
              },
            },
          ],
  metadata: {
    supabaseConfigured,
    apiSupabaseUrl,
    jwtMode: apiSupabaseUrl.startsWith('https://') ? 'jwks' : 'hs256-secret',
  },
});
