import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

/**
 * Sliding-window limiter for public widget auth (single-instance MVP).
 * Bootstrap and chat use separate bucket namespaces so counters never share.
 * TODO(phase-10): Redis-backed shared limiter.
 */
@Injectable()
export class PublishableKeyRateLimiter {
  private readonly hits = new Map<string, number[]>();

  private static readonly WINDOW_MS = 60_000;
  private static readonly BOOTSTRAP_KEY_LIMIT = 60;
  private static readonly CHAT_KEY_LIMIT = 20;
  private static readonly CHAT_ORG_LIMIT = 40;
  private static readonly CHAT_IP_LIMIT = 30;

  /** Bootstrap: 60 requests / 60s per publishable key id. */
  assertBootstrap(keyId: string): void {
    this.pruneAndCount(
      `bootstrap:key:${keyId}`,
      PublishableKeyRateLimiter.BOOTSTRAP_KEY_LIMIT,
      'public key',
    );
  }

  /**
   * Chat stream: 20 / 60s per key + 40 / 60s per organization + 30 / 60s per client IP.
   * Buckets are independent from bootstrap.
   */
  assertChat(keyId: string, organizationId: string, clientIp?: string): void {
    this.pruneAndCount(
      `chat:key:${keyId}`,
      PublishableKeyRateLimiter.CHAT_KEY_LIMIT,
      'public key chat',
    );
    this.pruneAndCount(
      `chat:org:${organizationId}`,
      PublishableKeyRateLimiter.CHAT_ORG_LIMIT,
      'organization chat',
    );
    if (clientIp) {
      this.pruneAndCount(
        `chat:ip:${clientIp}`,
        PublishableKeyRateLimiter.CHAT_IP_LIMIT,
        'client IP chat',
      );
    }
  }

  /** @deprecated Prefer assertBootstrap — kept for any stray callers during transition. */
  assertWithinLimits(keyId: string): void {
    this.assertBootstrap(keyId);
  }

  /** Test helper. */
  reset(): void {
    this.hits.clear();
  }

  private pruneAndCount(bucketKey: string, limit: number, scope: string): void {
    const now = Date.now();
    const windowStart = now - PublishableKeyRateLimiter.WINDOW_MS;
    const timestamps = (this.hits.get(bucketKey) ?? []).filter((ts) => ts > windowStart);

    if (timestamps.length >= limit) {
      // Retry-After is applied by pipeAiSse writeHttpError (and Nest filters that map 429).
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
    this.hits.set(bucketKey, timestamps);
  }
}
