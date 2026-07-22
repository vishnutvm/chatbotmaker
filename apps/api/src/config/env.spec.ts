import {
  buildStartupEnvSnapshot,
  getCorsOrigins,
  getDatabaseUrl,
  getDirectDatabaseUrl,
  getOpenAiApiKey,
  getRequiredEnv,
  getSupabaseJwtSecret,
  getSupabaseUrl,
  getWebAppOrigin,
  logStartupEnv,
  redactPostgresUrl,
  validateProductionEnv,
  validateSupabaseUrlForProduction,
} from './env';

describe('validateSupabaseUrlForProduction', () => {
  it('rejects missing URL', () => {
    expect(() => validateSupabaseUrlForProduction(undefined)).toThrow(/SUPABASE_URL is required/);
    expect(() => validateSupabaseUrlForProduction('')).toThrow(/SUPABASE_URL is required/);
  });

  it('rejects localhost URLs', () => {
    expect(() => validateSupabaseUrlForProduction('http://127.0.0.1:54321')).toThrow(/localhost/);
    expect(() => validateSupabaseUrlForProduction('https://localhost:54321')).toThrow(/localhost/);
  });

  it('rejects non-Supabase hosted URLs', () => {
    expect(() => validateSupabaseUrlForProduction('https://example.com')).toThrow(
      /hosted Supabase URL/,
    );
  });

  it('accepts hosted Supabase project URL', () => {
    expect(() =>
      validateSupabaseUrlForProduction('https://rocxcjxaqceqndkymujl.supabase.co'),
    ).not.toThrow();
    expect(() =>
      validateSupabaseUrlForProduction('https://rocxcjxaqceqndkymujl.supabase.co/'),
    ).not.toThrow();
  });
});

describe('validateProductionEnv', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSupabaseUrl = process.env.SUPABASE_URL;

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
    if (originalSupabaseUrl === undefined) {
      delete process.env.SUPABASE_URL;
    } else {
      process.env.SUPABASE_URL = originalSupabaseUrl;
    }
  });

  it('no-ops outside production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.SUPABASE_URL;

    expect(() => validateProductionEnv()).not.toThrow();
  });

  it('throws in production when SUPABASE_URL is missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.SUPABASE_URL;

    expect(() => validateProductionEnv()).toThrow(/SUPABASE_URL is required/);
  });

  it('passes in production with valid hosted Supabase URL', () => {
    process.env.NODE_ENV = 'production';
    process.env.SUPABASE_URL = 'https://rocxcjxaqceqndkymujl.supabase.co';

    expect(() => validateProductionEnv()).not.toThrow();
  });
});

describe('redactPostgresUrl', () => {
  it('redacts password and preserves host, user, port, database', () => {
    const redacted = redactPostgresUrl(
      'postgresql://postgres.rocxcjxaqceqndkymujl:secret@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
    );

    expect(redacted).toBe(
      'postgresql://postgres.rocxcjxaqceqndkymujl:***@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
    );
    expect(redacted).not.toContain('secret');
  });

  it('returns not set for empty values', () => {
    expect(redactPostgresUrl(undefined)).toBe('(not set)');
    expect(redactPostgresUrl('')).toBe('(not set)');
  });

  it('returns invalid marker for malformed URLs', () => {
    expect(redactPostgresUrl('not-a-url')).toBe('(invalid url)');
  });
});

describe('env helpers', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('getRequiredEnv throws when missing', () => {
    delete process.env.MISSING_ENV_KEY;
    expect(() => getRequiredEnv('MISSING_ENV_KEY')).toThrow(/Missing required environment variable/);
  });

  it('returns database and supabase defaults when unset', () => {
    delete process.env.DATABASE_URL;
    delete process.env.DIRECT_URL;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_JWT_SECRET;
    delete process.env.OPENAI_API_KEY;
    delete process.env.CORS_ORIGINS;
    delete process.env.WEB_APP_URL;
    delete process.env.APP_WEB_URL;

    expect(getDatabaseUrl()).toContain('127.0.0.1:5432');
    expect(getDirectDatabaseUrl()).toBe(getDatabaseUrl());
    expect(getSupabaseUrl()).toContain('127.0.0.1:54321');
    expect(getSupabaseJwtSecret().length).toBeGreaterThan(20);
    expect(getOpenAiApiKey()).toBeUndefined();
    expect(getCorsOrigins()).toEqual(['http://localhost:3001', 'http://localhost:3000']);
    expect(getWebAppOrigin()).toBe('http://localhost:3001');
  });

  it('prefers WEB_APP_URL and parses CORS origins', () => {
    process.env.CORS_ORIGINS = ' https://a.example , ,https://b.example ';
    process.env.WEB_APP_URL = 'https://app.example/';
    expect(getCorsOrigins()).toEqual(['https://a.example', 'https://b.example']);
    expect(getWebAppOrigin()).toBe('https://app.example');
  });

  it('buildStartupEnvSnapshot reports hs256 for localhost supabase and empty secret as unset', () => {
    process.env.SUPABASE_URL = 'http://127.0.0.1:54321';
    process.env.SUPABASE_JWT_SECRET = '';
    delete process.env.OPENAI_API_KEY;

    const snapshot = buildStartupEnvSnapshot();
    expect(snapshot.jwtVerification).toBe('hs256-secret');
    expect(snapshot.secrets.supabaseJwtSecret).toBe('unset');
    expect(snapshot.secrets.openaiApiKey).toBe('unset');
  });

  it('treats https localhost Supabase as hs256-secret mode', () => {
    process.env.SUPABASE_URL = 'https://localhost:54321';
    expect(buildStartupEnvSnapshot().jwtVerification).toBe('hs256-secret');
  });

  it('logStartupEnv writes a redacted snapshot', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    process.env.SUPABASE_URL = 'https://rocxcjxaqceqndkymujl.supabase.co';
    logStartupEnv();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('buildStartupEnvSnapshot', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('reports jwks mode for hosted Supabase without exposing secrets', () => {
    process.env.NODE_ENV = 'production';
    process.env.SUPABASE_URL = 'https://rocxcjxaqceqndkymujl.supabase.co';
    process.env.DATABASE_URL =
      'postgresql://postgres.rocxcjxaqceqndkymujl:secret@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';
    process.env.CORS_ORIGINS = 'https://chatbotmaker-dev.vercel.app';
    process.env.AI_DEFAULT_MODEL = 'gpt-4o-mini';
    process.env.OPENAI_API_KEY = 'sk-test';

    const snapshot = buildStartupEnvSnapshot();

    expect(snapshot.jwtVerification).toBe('jwks');
    expect(snapshot.databaseUrl).not.toContain('secret');
    expect(snapshot.corsOrigins).toEqual(['https://chatbotmaker-dev.vercel.app']);
    expect(snapshot.aiDefaultModel).toBe('gpt-4o-mini');
    expect(snapshot.secrets.openaiApiKey).toBe('set');
  });
});
