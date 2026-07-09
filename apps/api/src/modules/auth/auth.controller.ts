import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, OptionalCurrentUser } from '../../common/decorators/current-user.decorator';
import { SupabaseIdentityParam } from '../../common/decorators/supabase-identity.decorator';
import type { AuthenticatedUser, SupabaseIdentity } from '../../common/types/jwt-payload';
import { AuthService } from './auth.service';
import { OnboardDto } from './dto/auth.dto';
import { SupabaseIdentityGuard } from './guards/supabase-identity.guard';
import { SupabaseJwtGuard } from './guards/supabase-jwt.guard';
import { OptionalSupabaseJwtGuard } from './guards/optional-supabase-jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('onboard')
  @UseGuards(SupabaseIdentityGuard)
  onboard(@SupabaseIdentityParam() identity: SupabaseIdentity, @Body() dto: OnboardDto) {
    return this.authService.onboard(identity, dto);
  }

  @Get('me')
  @UseGuards(SupabaseJwtGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.userId);
  }

  /** Validates token and returns whether the user has completed onboarding */
  @Get('session')
  @UseGuards(OptionalSupabaseJwtGuard)
  async session(@OptionalCurrentUser() user: AuthenticatedUser | null) {
    if (!user) {
      return { onboarded: false };
    }
    try {
      const me = await this.authService.getMe(user.userId);
      return { onboarded: true, ...me };
    } catch {
      return { onboarded: false };
    }
  }
}
