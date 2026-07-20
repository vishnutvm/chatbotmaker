import { AiRateLimiter } from './ai-rate-limiter';

describe('AiRateLimiter', () => {
  let limiter: AiRateLimiter;

  beforeEach(() => {
    limiter = new AiRateLimiter();
    limiter.reset();
  });

  it('allows requests under the user limit', () => {
    expect(() => limiter.assertWithinLimits('u1', 'o1')).not.toThrow();
  });

  it('throws 429 after the per-user limit', () => {
    for (let i = 0; i < 30; i += 1) {
      limiter.assertWithinLimits('u-limit', 'o-shared');
    }
    expect(() => limiter.assertWithinLimits('u-limit', 'o-shared')).toThrow(
      expect.objectContaining({ status: 429 }),
    );
  });

  it('reset clears buckets', () => {
    for (let i = 0; i < 30; i += 1) {
      limiter.assertWithinLimits('u2', 'o2');
    }
    limiter.reset();
    expect(() => limiter.assertWithinLimits('u2', 'o2')).not.toThrow();
  });
});
