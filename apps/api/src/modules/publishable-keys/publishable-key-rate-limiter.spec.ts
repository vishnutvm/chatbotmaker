import { HttpException, HttpStatus } from '@nestjs/common';
import { PublishableKeyRateLimiter } from './publishable-key-rate-limiter';

describe('PublishableKeyRateLimiter', () => {
  let limiter: PublishableKeyRateLimiter;

  beforeEach(() => {
    limiter = new PublishableKeyRateLimiter();
  });

  it('allows requests under the limit', () => {
    for (let i = 0; i < 60; i += 1) {
      expect(() => limiter.assertWithinLimits('key-1')).not.toThrow();
    }
  });

  it('throws 429 after the per-key limit', () => {
    for (let i = 0; i < 60; i += 1) {
      limiter.assertWithinLimits('key-1');
    }
    try {
      limiter.assertWithinLimits('key-1');
      fail('expected rate limit');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    }
  });

  it('isolates buckets per key id', () => {
    for (let i = 0; i < 60; i += 1) {
      limiter.assertWithinLimits('key-a');
    }
    expect(() => limiter.assertWithinLimits('key-b')).not.toThrow();
  });
});
