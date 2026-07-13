import { defineConfig, devices } from '@playwright/test';

const dashboardPort = process.env.E2E_DASHBOARD_PORT ?? '3000';
const apiPort = process.env.E2E_API_PORT ?? '4000';
const dashboardUrl = process.env.E2E_DASHBOARD_URL ?? `http://localhost:${dashboardPort}`;
const apiUrl = process.env.E2E_API_URL ?? `http://localhost:${apiPort}`;

const supabaseConfigured = Boolean(
  process.env.E2E_SUPABASE_URL && process.env.E2E_SUPABASE_ANON_KEY,
);

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
  SUPABASE_URL: process.env.E2E_SUPABASE_URL ?? 'http://127.0.0.1:54321',
  SUPABASE_JWT_SECRET:
    process.env.SUPABASE_JWT_SECRET ??
    'ci-test-jwt-secret-minimum-32-characters',
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
      testMatch: /(smoke|auth-guards|create-assistant)\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: dashboardUrl,
      },
    },
    {
      name: 'full-stack',
      testMatch: /(auth-api|auth-flow)\.spec\.ts/,
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
                NEXT_PUBLIC_SUPABASE_URL: process.env.E2E_SUPABASE_URL ?? 'http://127.0.0.1:54321',
                NEXT_PUBLIC_SUPABASE_ANON_KEY:
                  process.env.E2E_SUPABASE_ANON_KEY ?? 'public-anon-key',
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
                NEXT_PUBLIC_SUPABASE_URL: process.env.E2E_SUPABASE_URL ?? 'http://127.0.0.1:54321',
                NEXT_PUBLIC_SUPABASE_ANON_KEY:
                  process.env.E2E_SUPABASE_ANON_KEY ?? 'public-anon-key',
              },
            },
          ],
  metadata: {
    supabaseConfigured,
  },
});
