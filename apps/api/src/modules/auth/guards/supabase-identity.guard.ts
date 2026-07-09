import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class SupabaseIdentityGuard extends AuthGuard('supabase-identity') {}
