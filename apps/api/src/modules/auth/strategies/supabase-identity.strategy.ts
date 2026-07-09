import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { SupabaseIdentity, SupabaseJwtPayload } from '../../../common/types/jwt-payload';
import { buildSupabaseJwtStrategyOptions } from './supabase-jwt-options';

@Injectable()
export class SupabaseIdentityStrategy extends PassportStrategy(Strategy, 'supabase-identity') {
  constructor() {
    super({
      ...buildSupabaseJwtStrategyOptions(),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  validate(payload: SupabaseJwtPayload): SupabaseIdentity {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token');
    }
    return {
      supabaseUserId: payload.sub,
      email: payload.email ?? '',
    };
  }
}
