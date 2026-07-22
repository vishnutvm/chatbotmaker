import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { PublishableKeyRequestContext } from '../guards/publishable-key.guard';

export const CurrentPublishableKey = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PublishableKeyRequestContext => {
    const req = ctx.switchToHttp().getRequest<{
      publishableKey?: PublishableKeyRequestContext;
    }>();
    if (!req.publishableKey) {
      throw new Error('PublishableKeyGuard did not attach context');
    }
    return req.publishableKey;
  },
);
