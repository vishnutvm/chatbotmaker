/** Treat blank env vars as unset (GitHub Actions secrets can be empty strings). */
export function readEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}
