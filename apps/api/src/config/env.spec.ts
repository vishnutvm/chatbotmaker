import { validateProductionEnv, validateSupabaseUrlForProduction } from './env';

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
