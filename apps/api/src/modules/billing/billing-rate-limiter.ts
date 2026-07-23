import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

/**
 * Simple sliding-window rate limiter for Checkout/Portal (single-instance MVP).
 * Limit: 10 requests / minute per user+org.
 */
@Injectable()
export class BillingRateLimiter {
  private readonly hits = new Map<string, number[]>();

  private static readonly WINDOW_MS = 60_000;
  private static readonly LIMIT = 10;

  assertWithinLimits(userId: string, organizationId: string): void {
    const key = `${userId}:${organizationId}`;
    const now = Date.now();
    const windowStart = now - BillingRateLimiter.WINDOW_MS;
    const timestamps = (this.hits.get(key) ?? []).filter((ts) => ts > windowStart);

    if (timestamps.length >= BillingRateLimiter.LIMIT) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded for billing',
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    timestamps.push(now);
    this.hits.set(key, timestamps);
  }

  /** Test helper — clears all buckets. */
  reset(): void {
    this.hits.clear();
  }
}
