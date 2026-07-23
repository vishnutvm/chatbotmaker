import { HttpException, HttpStatus } from '@nestjs/common';
import { PublishableKeyRateLimiter } from './publishable-key-rate-limiter';

describe('PublishableKeyRateLimiter', () => {
  let limiter: PublishableKeyRateLimiter;

  beforeEach(() => {
    limiter = new PublishableKeyRateLimiter();
  });

  describe('assertBootstrap', () => {
    it('allows requests under the limit', () => {
      for (let i = 0; i < 60; i += 1) {
        expect(() => limiter.assertBootstrap('key-1')).not.toThrow();
      }
    });

    it('throws 429 after the per-key limit', () => {
      for (let i = 0; i < 60; i += 1) {
        limiter.assertBootstrap('key-1');
      }
      try {
        limiter.assertBootstrap('key-1');
        fail('expected rate limit');
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        expect((err as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      }
    });

    it('isolates buckets per key id', () => {
      for (let i = 0; i < 60; i += 1) {
        limiter.assertBootstrap('key-a');
      }
      expect(() => limiter.assertBootstrap('key-b')).not.toThrow();
    });
  });

  describe('assertChat', () => {
    it('allows under key and org limits', () => {
      for (let i = 0; i < 20; i += 1) {
        expect(() => limiter.assertChat('key-1', 'org-1')).not.toThrow();
      }
    });

    it('throws 429 after per-key chat limit (20)', () => {
      for (let i = 0; i < 20; i += 1) {
        limiter.assertChat('key-1', 'org-1');
      }
      try {
        limiter.assertChat('key-1', 'org-1');
        fail('expected key chat rate limit');
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        expect((err as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      }
    });

    it('throws 429 after per-org chat limit (40) across keys', () => {
      for (let i = 0; i < 20; i += 1) {
        limiter.assertChat('key-a', 'org-shared');
      }
      for (let i = 0; i < 20; i += 1) {
        limiter.assertChat('key-b', 'org-shared');
      }
      try {
        limiter.assertChat('key-c', 'org-shared');
        fail('expected org chat rate limit');
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        expect((err as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      }
    });

    it('throws 429 after per-IP chat limit (30)', () => {
      for (let i = 0; i < 30; i += 1) {
        // Rotate keys/orgs so only the IP bucket trips.
        limiter.assertChat(`key-${i}`, `org-${i}`, '203.0.113.10');
      }
      try {
        limiter.assertChat('key-overflow', 'org-overflow', '203.0.113.10');
        fail('expected IP chat rate limit');
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        expect((err as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        expect((err as HttpException).getResponse()).toMatchObject({
          message: expect.stringContaining('client IP chat'),
        });
      }
    });

    it('isolates IP buckets', () => {
      for (let i = 0; i < 30; i += 1) {
        limiter.assertChat(`key-a-${i}`, `org-a-${i}`, '203.0.113.1');
      }
      expect(() =>
        limiter.assertChat('key-b', 'org-b', '203.0.113.2'),
      ).not.toThrow();
    });

    it('does not share counters with bootstrap', () => {
      for (let i = 0; i < 60; i += 1) {
        limiter.assertBootstrap('key-1');
      }
      expect(() => limiter.assertChat('key-1', 'org-1')).not.toThrow();

      limiter.reset();
      for (let i = 0; i < 20; i += 1) {
        limiter.assertChat('key-1', 'org-1');
      }
      expect(() => limiter.assertBootstrap('key-1')).not.toThrow();
    });
  });

  it('reset clears all buckets', () => {
    for (let i = 0; i < 60; i += 1) {
      limiter.assertBootstrap('key-1');
    }
    for (let i = 0; i < 20; i += 1) {
      limiter.assertChat('key-2', 'org-1');
    }
    limiter.reset();
    expect(() => limiter.assertBootstrap('key-1')).not.toThrow();
    expect(() => limiter.assertChat('key-2', 'org-1')).not.toThrow();
  });

  it('assertWithinLimits delegates to assertBootstrap', () => {
    for (let i = 0; i < 60; i += 1) {
      limiter.assertWithinLimits('key-legacy');
    }
    expect(() => limiter.assertWithinLimits('key-legacy')).toThrow(HttpException);
    expect(() => limiter.assertChat('key-legacy', 'org-1')).not.toThrow();
  });
});

