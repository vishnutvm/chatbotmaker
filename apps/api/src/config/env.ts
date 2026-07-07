export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function getMongoUri(): string {
  return process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/genie_dev';
}

export function getJwtSecrets(): { access: string; refresh: string } {
  const access = process.env.JWT_SECRET ?? 'dev-only-jwt-secret-change-in-production-32chars';
  const refresh =
    process.env.JWT_REFRESH_SECRET ?? 'dev-only-refresh-secret-change-in-production-32c';
  return { access, refresh };
}

export function getCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS;
  if (!raw) {
    return ['http://localhost:3001', 'http://localhost:3000'];
  }
  return raw.split(',').map((o) => o.trim()).filter(Boolean);
}
