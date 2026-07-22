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
});
