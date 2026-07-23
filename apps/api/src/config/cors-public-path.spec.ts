import { isPublicApiPath } from './cors-public-path';

describe('isPublicApiPath', () => {
  it('matches public pathname', () => {
    expect(isPublicApiPath({ path: '/api/v1/public/widget/bootstrap', originalUrl: '', url: '' })).toBe(
      true,
    );
  });

  it('does not match query substring injection', () => {
    expect(
      isPublicApiPath({
        path: '/api/v1/me',
        originalUrl: '/api/v1/me?x=/api/v1/public/',
        url: '/api/v1/me?x=/api/v1/public/',
      }),
    ).toBe(false);
  });

  it('strips query from originalUrl when path empty', () => {
    expect(
      isPublicApiPath({
        path: '',
        originalUrl: '/api/v1/public/widget/bootstrap?assistantId=1',
        url: '',
      }),
    ).toBe(true);
  });

  it('matches exact public root and falls back to url when path fields empty', () => {
    expect(isPublicApiPath({ path: '/api/v1/public', originalUrl: '', url: '' })).toBe(true);
    expect(
      isPublicApiPath({
        path: '',
        originalUrl: '',
        url: '/api/v1/public/widget/bootstrap',
      }),
    ).toBe(true);
  });

  it('returns false when path, originalUrl, and url are all empty', () => {
    expect(isPublicApiPath({ path: '', originalUrl: '', url: '' })).toBe(false);
  });

  it('matches stripe webhook path as public', () => {
    expect(isPublicApiPath({ path: '/api/v1/webhooks/stripe', originalUrl: '', url: '' })).toBe(
      true,
    );
  });
});
