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

  afterEach(() => {
    if (originalSupabaseUrl === undefined) {
      delete process.env.SUPABASE_URL;
    } else {
      process.env.SUPABASE_URL = originalSupabaseUrl;
    }
  });

  it('uses JWKS with issuer and audience for hosted Supabase', () => {
    process.env.SUPABASE_URL = 'https://rocxcjxaqceqndkymujl.supabase.co';

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
