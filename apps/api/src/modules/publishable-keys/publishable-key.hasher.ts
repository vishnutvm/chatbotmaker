import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { Injectable } from '@nestjs/common';
import { getPublishableKeyPepper } from '../../config/env';

export const PK_LIVE_PREFIX = 'pk_live_';

/** Matches generated keys: pk_live_ + base64url(32 bytes). */
export const PK_LIVE_PATTERN = /^pk_live_[A-Za-z0-9_-]{40,50}$/;

@Injectable()
export class PublishableKeyHasher {
  hash(rawKey: string): string {
    return createHmac('sha256', getPublishableKeyPepper()).update(rawKey, 'utf8').digest('hex');
  }

  generateRawKey(): string {
    const suffix = randomBytes(32).toString('base64url');
    return `${PK_LIVE_PREFIX}${suffix}`;
  }

  isValidFormat(rawKey: string): boolean {
    return PK_LIVE_PATTERN.test(rawKey);
  }

  /** Display-safe prefix: first 12 chars + … + last 4. */
  toDisplayPrefix(rawKey: string): string {
    if (rawKey.length < 16) {
      return `${PK_LIVE_PREFIX}…`;
    }
    return `${rawKey.slice(0, 12)}…${rawKey.slice(-4)}`;
  }

  /** Constant-time hex compare (defense in depth after unique lookup). */
  hashesEqual(a: string, b: string): boolean {
    try {
      const ba = Buffer.from(a, 'hex');
      const bb = Buffer.from(b, 'hex');
      if (ba.length !== bb.length) return false;
      return timingSafeEqual(ba, bb);
    } catch {
      return false;
    }
  }
}
