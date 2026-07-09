import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthenticatedUser, SupabaseJwtPayload } from '../../../common/types/jwt-payload';
import { UsersRepository } from '../../users/users.repository';
import { buildSupabaseJwtStrategyOptions } from './supabase-jwt-options';

@Injectable()
export class OptionalSupabaseJwtStrategy extends PassportStrategy(
  Strategy,
  'optional-supabase-jwt',
) {
  constructor(private readonly usersRepository: UsersRepository) {
    super({
      ...buildSupabaseJwtStrategyOptions(),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: SupabaseJwtPayload): Promise<AuthenticatedUser | null> {
    if (!payload.sub) {
      return null;
    }

    const user = await this.usersRepository.findBySupabaseUserId(payload.sub);
    if (!user) {
      return {
        supabaseUserId: payload.sub,
        userId: '',
        email: payload.email ?? '',
      };
    }

    return {
      supabaseUserId: payload.sub,
      userId: user.id,
      email: user.email,
    };
  }
}
