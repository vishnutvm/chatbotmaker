import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { SupabaseIdentity } from '../types/jwt-payload';

export const SupabaseIdentityParam = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SupabaseIdentity => {
    const request = ctx.switchToHttp().getRequest<{ user: SupabaseIdentity }>();
    return request.user;
  },
);
