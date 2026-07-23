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

  if (!process.env.PUBLISHABLE_KEY_PEPPER?.trim()) {
    throw new Error(
      'PUBLISHABLE_KEY_PEPPER is required in production (HMAC pepper for pk_live keys).',
    );
  }
  if (process.env.PUBLISHABLE_KEY_PEPPER.trim().length < 32) {
    throw new Error('PUBLISHABLE_KEY_PEPPER must be at least 32 characters in production.');
  }
}

/**
 * Pepper for HMAC-SHA256 of publishable keys.
 * Dev fallback is deterministic for local/tests only — never use in production.
 */
export function getPublishableKeyPepper(): string {
  const value = process.env.PUBLISHABLE_KEY_PEPPER?.trim();
  if (value) {
    return value;
  }
  if (isProduction()) {
    throw new Error('PUBLISHABLE_KEY_PEPPER is required in production');
  }
  return 'dev-only-publishable-key-pepper-not-for-production';
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

/** Stripe secret key — undefined when unset (Checkout/Portal return 503). */
export function getStripeSecretKey(): string | undefined {
  const value = process.env.STRIPE_SECRET_KEY?.trim();
  return value || undefined;
}

/** Stripe webhook signing secret — undefined when unset. */
export function getStripeWebhookSecret(): string | undefined {
  const value = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  return value || undefined;
}

/** Stripe Price ID for Starter plan. */
export function getStripePriceStarter(): string | undefined {
  const value = process.env.STRIPE_PRICE_STARTER?.trim();
  return value || undefined;
}

/** Stripe Price ID for Pro plan. */
export function getStripePricePro(): string | undefined {
  const value = process.env.STRIPE_PRICE_PRO?.trim();
  return value || undefined;
}

/** Checkout success redirect (supports `{CHECKOUT_SESSION_ID}` placeholder). */
export function getStripeCheckoutSuccessUrl(): string {
  const explicit = process.env.STRIPE_CHECKOUT_SUCCESS_URL?.trim();
  if (explicit) {
    return explicit;
  }
  return `${getWebAppOrigin()}/dashboard/billing?billing=success&session_id={CHECKOUT_SESSION_ID}`;
}

/** Checkout cancel redirect. */
export function getStripeCheckoutCancelUrl(): string {
  const explicit = process.env.STRIPE_CHECKOUT_CANCEL_URL?.trim();
  if (explicit) {
    return explicit;
  }
  return `${getWebAppOrigin()}/dashboard/billing?billing=cancel`;
}

/** Customer Portal return URL. */
export function getStripePortalReturnUrl(): string {
  const explicit = process.env.STRIPE_PORTAL_RETURN_URL?.trim();
  if (explicit) {
    return explicit;
  }
  return `${getWebAppOrigin()}/dashboard/billing`;
}

/** True when secret key and both price IDs are configured. */
export function isStripeBillingConfigured(): boolean {
  return Boolean(getStripeSecretKey() && getStripePriceStarter() && getStripePricePro());
}

/** OpenAI API key — undefined when unset (chat endpoints return 503). */
export function getOpenAiApiKey(): string | undefined {
  const value = process.env.OPENAI_API_KEY?.trim();
  return value || undefined;
}

/** Server-enforced chat model; clients cannot override. */
export function getAiDefaultModel(): string {
  return process.env.AI_DEFAULT_MODEL?.trim() || 'gpt-4o-mini';
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
  aiDefaultModel: string;
  secrets: {
    supabaseJwtSecret: 'set' | 'default-dev-fallback' | 'unset';
    supabaseServiceRoleKey: 'set' | 'unset';
    openaiApiKey: 'set' | 'unset';
    stripeSecretKey: 'set' | 'unset';
    stripeWebhookSecret: 'set' | 'unset';
    stripePriceStarter: 'set' | 'unset';
    stripePricePro: 'set' | 'unset';
    publishableKeyPepper: 'set' | 'default-dev-fallback' | 'unset';
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
    aiDefaultModel: getAiDefaultModel(),
    secrets: {
      supabaseJwtSecret: jwtSecret?.trim()
        ? 'set'
        : process.env.SUPABASE_JWT_SECRET === ''
          ? 'unset'
          : 'default-dev-fallback',
      supabaseServiceRoleKey: secretPresence(process.env.SUPABASE_SERVICE_ROLE_KEY),
      openaiApiKey: secretPresence(process.env.OPENAI_API_KEY),
      stripeSecretKey: secretPresence(process.env.STRIPE_SECRET_KEY),
      stripeWebhookSecret: secretPresence(process.env.STRIPE_WEBHOOK_SECRET),
      stripePriceStarter: secretPresence(process.env.STRIPE_PRICE_STARTER),
      stripePricePro: secretPresence(process.env.STRIPE_PRICE_PRO),
      publishableKeyPepper: process.env.PUBLISHABLE_KEY_PEPPER?.trim()
        ? 'set'
        : process.env.PUBLISHABLE_KEY_PEPPER === ''
          ? 'unset'
          : 'default-dev-fallback',
    },
  };
}

/** Log env at boot so Railway deploy logs show what the API actually received. */
export function logStartupEnv(): void {
  const snapshot = buildStartupEnvSnapshot();
  console.log('[genie-api] Startup environment (secrets redacted):');
  console.log(JSON.stringify(snapshot, null, 2));
}
