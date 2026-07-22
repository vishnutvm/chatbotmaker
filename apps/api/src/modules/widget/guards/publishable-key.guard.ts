import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { PublishableKeysService } from '../../publishable-keys/publishable-keys.service';

export type PublishableKeyRequestContext = {
  keyId: string;
  organizationId: string;
};

/**
 * Extracts pk_live from X-Genie-Public-Key or Authorization: Bearer.
 * Rejects keys passed via query string.
 */
@Injectable()
export class PublishableKeyGuard implements CanActivate {
  constructor(private readonly publishableKeysService: PublishableKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    if (typeof req.query?.apiKey === 'string' || typeof req.query?.key === 'string') {
      throw new BadRequestException('Public key must be sent in headers, not query');
    }

    // Prefer dedicated header so host-page Bearer JWTs never collide.
    const headerKey = req.header('x-genie-public-key')?.trim();
    const auth = req.header('authorization')?.trim();
    let rawKey = headerKey;

    if (!rawKey && auth?.toLowerCase().startsWith('bearer ')) {
      const token = auth.slice(7).trim();
      if (token.startsWith('pk_live_')) {
        rawKey = token;
      }
    }

    const verified = await this.publishableKeysService.verifyRawKey(rawKey);
    (req as Request & { publishableKey?: PublishableKeyRequestContext }).publishableKey =
      verified;

    return true;
  }
}
