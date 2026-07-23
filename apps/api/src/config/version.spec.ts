import { buildVersionPayload, resolveGitSha, shortSha } from './version';

describe('version helpers', () => {
  it('resolves git sha from Railway env', () => {
    expect(resolveGitSha({ RAILWAY_GIT_COMMIT_SHA: 'abcdef1234567890' })).toBe('abcdef1234567890');
    expect(shortSha('abcdef1234567890')).toBe('abcdef1');
  });

  it('prefers GIT_COMMIT_SHA then SOURCE_COMMIT then COMMIT_SHA', () => {
    expect(resolveGitSha({ GIT_COMMIT_SHA: '1111111111111111', RAILWAY_GIT_COMMIT_SHA: '2222' })).toBe(
      '1111111111111111',
    );
    expect(resolveGitSha({ SOURCE_COMMIT: '3333333333333333' })).toBe('3333333333333333');
    expect(resolveGitSha({ COMMIT_SHA: '4444444444444444' })).toBe('4444444444444444');
    expect(resolveGitSha({ GIT_COMMIT_SHA: '   ' })).toBe('unknown');
  });

  it('builds version payload', () => {
    const payload = buildVersionPayload({
      service: 'genie-api',
      version: '0.1.0',
      env: {
        NODE_ENV: 'production',
        RAILWAY_ENVIRONMENT_NAME: 'production',
        RAILWAY_GIT_COMMIT_SHA: 'deadbeefcafebabe',
      },
    });

    expect(payload.service).toBe('genie-api');
    expect(payload.version).toBe('0.1.0');
    expect(payload.gitShaShort).toBe('deadbee');
    expect(payload.environment).toBe('production');
  });

  it('falls back to unknown sha and environment when CI vars are absent', () => {
    expect(resolveGitSha({})).toBe('unknown');
    expect(shortSha('unknown')).toBe('unknown');
    expect(shortSha('')).toBe('unknown');

    const payload = buildVersionPayload({
      service: 'genie-api',
      version: '0.2.0',
      env: {},
    });

    expect(payload.gitSha).toBe('unknown');
    expect(payload.gitShaShort).toBe('unknown');
    expect(payload.environment).toBe('unknown');
    expect(payload.nodeEnv).toBe('unknown');
  });

  it('prefers VERCEL_ENV then APP_ENV then NODE_ENV for environment', () => {
    expect(
      buildVersionPayload({
        service: 'genie-api',
        version: '0.2.0',
        env: { VERCEL_ENV: 'preview', NODE_ENV: 'production' },
      }).environment,
    ).toBe('preview');

    expect(
      buildVersionPayload({
        service: 'genie-api',
        version: '0.2.0',
        env: { APP_ENV: 'staging', NODE_ENV: 'production' },
      }).environment,
    ).toBe('staging');
  });
});
