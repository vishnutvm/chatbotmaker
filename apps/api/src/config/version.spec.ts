import { buildVersionPayload, resolveGitSha, shortSha } from './version';

describe('version helpers', () => {
  it('resolves git sha from Railway env', () => {
    expect(resolveGitSha({ RAILWAY_GIT_COMMIT_SHA: 'abcdef1234567890' })).toBe('abcdef1234567890');
    expect(shortSha('abcdef1234567890')).toBe('abcdef1');
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
});
