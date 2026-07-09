import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { OrganizationsModule } from '../organizations/organizations.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OptionalSupabaseJwtGuard } from './guards/optional-supabase-jwt.guard';
import { SupabaseIdentityGuard } from './guards/supabase-identity.guard';
import { SupabaseJwtGuard } from './guards/supabase-jwt.guard';
import { OptionalSupabaseJwtStrategy } from './strategies/optional-supabase-jwt.strategy';
import { SupabaseIdentityStrategy } from './strategies/supabase-identity.strategy';
import { SupabaseJwtStrategy } from './strategies/supabase-jwt.strategy';

@Module({
  imports: [UsersModule, OrganizationsModule, PassportModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    SupabaseIdentityStrategy,
    SupabaseJwtStrategy,
    OptionalSupabaseJwtStrategy,
    SupabaseIdentityGuard,
    SupabaseJwtGuard,
    OptionalSupabaseJwtGuard,
  ],
  exports: [AuthService, SupabaseJwtGuard],
})
export class AuthModule {}
