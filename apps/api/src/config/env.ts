export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
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
