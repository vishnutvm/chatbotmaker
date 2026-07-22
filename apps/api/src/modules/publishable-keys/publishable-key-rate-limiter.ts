import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

/**
 * Per-key sliding-window limiter for public widget auth (single-instance MVP).
 * TODO(phase-10): Redis-backed shared limiter.
 */
@Injectable()
export class PublishableKeyRateLimiter {
  private readonly hits = new Map<string, number[]>();

  private static readonly WINDOW_MS = 60_000;
  private static readonly KEY_LIMIT = 60;

  assertWithinLimits(keyId: string): void {
    const now = Date.now();
    const windowStart = now - PublishableKeyRateLimiter.WINDOW_MS;
    const timestamps = (this.hits.get(keyId) ?? []).filter((ts) => ts > windowStart);

    if (timestamps.length >= PublishableKeyRateLimiter.KEY_LIMIT) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded for public key',
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    timestamps.push(now);
    this.hits.set(keyId, timestamps);
  }

  /** Test helper. */
  reset(): void {
    this.hits.clear();
  }
}
