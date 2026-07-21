import jwt from 'jsonwebtoken';
import {
  buildSupabaseJwtStrategyOptions,
  getSupabaseJwtIssuer,
  shouldUseJwks,
} from './supabase-jwt-options';

describe('shouldUseJwks', () => {
  it('returns false for local http Supabase', () => {
    expect(shouldUseJwks('http://127.0.0.1:54321')).toBe(false);
  });

  it('returns false for local https Supabase', () => {
    expect(shouldUseJwks('https://127.0.0.1:54321')).toBe(false);
    expect(shouldUseJwks('https://localhost:54321')).toBe(false);
  });

  it('returns true for hosted https Supabase', () => {
    expect(shouldUseJwks('https://rocxcjxaqceqndkymujl.supabase.co')).toBe(true);
    expect(shouldUseJwks('https://rocxcjxaqceqndkymujl.supabase.co/')).toBe(true);
  });
});

describe('getSupabaseJwtIssuer', () => {
  it('builds issuer from Supabase project URL', () => {
    expect(getSupabaseJwtIssuer('https://rocxcjxaqceqndkymujl.supabase.co')).toBe(
      'https://rocxcjxaqceqndkymujl.supabase.co/auth/v1',
    );
  });
});

describe('buildSupabaseJwtStrategyOptions', () => {
  const originalSupabaseUrl = process.env.SUPABASE_URL;
  const originalJwtSecret = process.env.SUPABASE_JWT_SECRET;

  afterEach(() => {
    if (originalSupabaseUrl === undefined) {
      delete process.env.SUPABASE_URL;
    } else {
      process.env.SUPABASE_URL = originalSupabaseUrl;
    }
    if (originalJwtSecret === undefined) {
      delete process.env.SUPABASE_JWT_SECRET;
    } else {
      process.env.SUPABASE_JWT_SECRET = originalJwtSecret;
    }
  });

  it('uses JWKS provider with issuer/audience for hosted Supabase', () => {
    process.env.SUPABASE_URL = 'https://rocxcjxaqceqndkymujl.supabase.co';
    delete process.env.SUPABASE_JWT_SECRET;

    const options = buildSupabaseJwtStrategyOptions();

    expect(options).toHaveProperty('secretOrKeyProvider');
    expect(options).not.toHaveProperty('secretOrKey');
    expect(options.algorithms).toEqual(['ES256', 'RS256']);
    expect('issuer' in options && options.issuer).toBe(
      'https://rocxcjxaqceqndkymujl.supabase.co/auth/v1',
    );
    expect('audience' in options && options.audience).toBe('authenticated');
    expect(options.ignoreExpiration).toBe(false);
  });

  it('enables HS256 dual-mode only when SUPABASE_JWT_SECRET is explicitly set', () => {
    process.env.SUPABASE_URL = 'https://rocxcjxaqceqndkymujl.supabase.co';
    process.env.SUPABASE_JWT_SECRET = 'ci-test-jwt-secret-minimum-32-characters';

    const options = buildSupabaseJwtStrategyOptions();

    expect(options.algorithms).toEqual(['ES256', 'RS256', 'HS256']);
  });

  it('resolves HS256 test tokens via shared secret while in JWKS dual-mode', () => {
    process.env.SUPABASE_URL = 'https://rocxcjxaqceqndkymujl.supabase.co';
    process.env.SUPABASE_JWT_SECRET = 'ci-test-jwt-secret-minimum-32-characters';

    const options = buildSupabaseJwtStrategyOptions();
    expect(options).toHaveProperty('secretOrKeyProvider');

    const provider = (
      options as { secretOrKeyProvider: (req: unknown, token: string, done: (err: Error | null, key?: string) => void) => void }
    ).secretOrKeyProvider;

    const token = jwt.sign(
      {
        sub: 'user-1',
        email: 'a@example.com',
        role: 'authenticated',
        aud: 'authenticated',
        iss: 'https://rocxcjxaqceqndkymujl.supabase.co/auth/v1',
      },
      'ci-test-jwt-secret-minimum-32-characters',
      { algorithm: 'HS256', expiresIn: '1h' },
    );

    return new Promise<void>((resolve, reject) => {
      provider({}, token, (err, key) => {
        try {
          expect(err).toBeNull();
          expect(key).toBe('ci-test-jwt-secret-minimum-32-characters');
          resolve();
        } catch (assertionError) {
          reject(assertionError);
        }
      });
    });
  });

  it('uses HS256 shared secret for local Supabase default', () => {
    delete process.env.SUPABASE_URL;

    const options = buildSupabaseJwtStrategyOptions();

    expect(options).toHaveProperty('secretOrKey');
    expect(options).not.toHaveProperty('secretOrKeyProvider');
    expect(options.algorithms).toEqual(['HS256']);
    expect('issuer' in options).toBe(false);
    expect('audience' in options).toBe(false);
  });
});
