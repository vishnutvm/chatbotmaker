import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthenticatedUser, SupabaseJwtPayload } from '../../../common/types/jwt-payload';
import { AuthService } from '../auth.service';
import { buildSupabaseJwtStrategyOptions } from './supabase-jwt-options';

@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(Strategy, 'supabase-jwt') {
  constructor(private readonly authService: AuthService) {
    super({
      ...buildSupabaseJwtStrategyOptions(),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: SupabaseJwtPayload): Promise<AuthenticatedUser> {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token');
    }

    return this.authService.resolveAuthenticatedUser(payload.sub, payload.email);
  }
}
