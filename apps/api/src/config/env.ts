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
