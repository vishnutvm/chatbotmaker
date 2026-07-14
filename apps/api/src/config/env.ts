const PRODUCTION_SUPABASE_URL_PATTERN = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i;

export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/** Validates SUPABASE_URL for Railway/production — must be hosted https://*.supabase.co */
export function validateSupabaseUrlForProduction(url: string | undefined): void {
  if (!url?.trim()) {
    throw new Error(
      'SUPABASE_URL is required in production (e.g. https://<project-ref>.supabase.co). ' +
        'Without it the API defaults to http://127.0.0.1:54321 and JWT verification fails with 401.',
    );
  }

  const normalized = url.trim().replace(/\/$/, '');

  if (normalized.includes('127.0.0.1') || normalized.includes('localhost')) {
    throw new Error(
      `SUPABASE_URL must not point to localhost in production (got: ${url}). ` +
        'Set SUPABASE_URL to your hosted Supabase project URL.',
    );
  }

  if (!PRODUCTION_SUPABASE_URL_PATTERN.test(normalized)) {
    throw new Error(
      `SUPABASE_URL must be a hosted Supabase URL (https://<project-ref>.supabase.co) in production (got: ${url}).`,
    );
  }
}

/** Fail fast at boot when production env is misconfigured. */
export function validateProductionEnv(): void {
  if (!isProduction()) {
    return;
  }

  validateSupabaseUrlForProduction(process.env.SUPABASE_URL);
}

export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:5432/genie_dev';
}

export function getDirectDatabaseUrl(): string {
  return process.env.DIRECT_URL ?? getDatabaseUrl();
}

export function getSupabaseUrl(): string {
  return process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
}

export function getSupabaseJwtSecret(): string {
  return (
    process.env.SUPABASE_JWT_SECRET ??
    'super-secret-jwt-token-with-at-least-32-characters-long'
  );
}

export function getCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS;
  if (!raw) {
    return ['http://localhost:3001', 'http://localhost:3000'];
  }
  return raw.split(',').map((o) => o.trim()).filter(Boolean);
}

/** Public web app origin for invite links (falls back to first CORS origin). */
export function getWebAppOrigin(): string {
  const explicit = process.env.WEB_APP_URL?.trim() || process.env.APP_WEB_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }
  return getCorsOrigins()[0] ?? 'http://localhost:3000';
}

/** Redact password from Postgres URLs for safe logging. */
export function redactPostgresUrl(url: string | undefined): string {
  if (!url?.trim()) {
    return '(not set)';
  }

  try {
    const parsed = new URL(url);
    const username = parsed.username ? `${decodeURIComponent(parsed.username)}:***@` : '';
    const database = parsed.pathname.replace(/^\//, '') || 'postgres';
    const port = parsed.port || '5432';
    const query = parsed.search || '';

    return `postgresql://${username}${parsed.hostname}:${port}/${database}${query}`;
  } catch {
    return '(invalid url)';
  }
}

function secretPresence(value: string | undefined): 'set' | 'unset' {
  return value?.trim() ? 'set' : 'unset';
}

function resolveJwtVerificationMode(supabaseUrl: string): 'jwks' | 'hs256-secret' {
  const normalized = supabaseUrl.replace(/\/$/, '');
  if (!normalized.startsWith('https://')) {
    return 'hs256-secret';
  }
  if (normalized.includes('127.0.0.1') || normalized.includes('localhost')) {
    return 'hs256-secret';
  }
  return 'jwks';
}

export type StartupEnvSnapshot = {
  nodeEnv: string;
  port: string;
  supabaseUrl: string;
  jwtVerification: 'jwks' | 'hs256-secret';
  databaseUrl: string;
  directUrl: string;
  corsOrigins: string[];
  secrets: {
    supabaseJwtSecret: 'set' | 'default-dev-fallback' | 'unset';
    supabaseServiceRoleKey: 'set' | 'unset';
    openaiApiKey: 'set' | 'unset';
    stripeSecretKey: 'set' | 'unset';
  };
};

/** Safe snapshot for Railway/debug logs — never includes raw secrets. */
export function buildStartupEnvSnapshot(): StartupEnvSnapshot {
  const supabaseUrl = getSupabaseUrl();
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;

  return {
    nodeEnv: process.env.NODE_ENV ?? '(not set)',
    port: process.env.PORT ?? '4000 (default)',
    supabaseUrl,
    jwtVerification: resolveJwtVerificationMode(supabaseUrl),
    databaseUrl: redactPostgresUrl(process.env.DATABASE_URL),
    directUrl: redactPostgresUrl(process.env.DIRECT_URL),
    corsOrigins: getCorsOrigins(),
    secrets: {
      supabaseJwtSecret: jwtSecret?.trim()
        ? 'set'
        : process.env.SUPABASE_JWT_SECRET === ''
          ? 'unset'
          : 'default-dev-fallback',
      supabaseServiceRoleKey: secretPresence(process.env.SUPABASE_SERVICE_ROLE_KEY),
      openaiApiKey: secretPresence(process.env.OPENAI_API_KEY),
      stripeSecretKey: secretPresence(process.env.STRIPE_SECRET_KEY),
    },
  };
}

/** Log env at boot so Railway deploy logs show what the API actually received. */
export function logStartupEnv(): void {
  const snapshot = buildStartupEnvSnapshot();
  console.log('[genie-api] Startup environment (secrets redacted):');
  console.log(JSON.stringify(snapshot, null, 2));
}
