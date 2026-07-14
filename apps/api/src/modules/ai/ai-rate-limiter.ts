import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

/**
 * Simple sliding-window rate limiter for single-instance MVP (Railway).
 * TODO(phase-10): replace with Redis-backed limiter for multi-instance.
 */
@Injectable()
export class AiRateLimiter {
  private readonly userHits = new Map<string, number[]>();
  private readonly orgHits = new Map<string, number[]>();

  private static readonly WINDOW_MS = 60_000;
  private static readonly USER_LIMIT = 30;
  private static readonly ORG_LIMIT = 60;

  assertWithinLimits(userId: string, organizationId: string): void {
    const now = Date.now();
    this.pruneAndCount(this.userHits, userId, now, AiRateLimiter.USER_LIMIT, 'user');
    this.pruneAndCount(this.orgHits, organizationId, now, AiRateLimiter.ORG_LIMIT, 'organization');
  }

  /** Test helper — clears all buckets. */
  reset(): void {
    this.userHits.clear();
    this.orgHits.clear();
  }

  private pruneAndCount(
    store: Map<string, number[]>,
    key: string,
    now: number,
    limit: number,
    scope: 'user' | 'organization',
  ): void {
    const windowStart = now - AiRateLimiter.WINDOW_MS;
    const timestamps = (store.get(key) ?? []).filter((ts) => ts > windowStart);

    if (timestamps.length === 0) {
      store.delete(key);
    }

    if (timestamps.length >= limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Rate limit exceeded for ${scope}`,
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    timestamps.push(now);
    store.set(key, timestamps);
  }
}
