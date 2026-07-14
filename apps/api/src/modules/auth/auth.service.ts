import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { MeResponse, OnboardResponse, OrganizationRole } from '@genie/types';
import { getRequiredEnv } from '../../config/env';
import type { AuthenticatedUser, SupabaseIdentity } from '../../common/types/jwt-payload';
import { OrganizationsRepository } from '../organizations/organizations.repository';
import { UsersRepository } from '../users/users.repository';
import type { OnboardDto, UpdateProfileDto } from './dto/auth.dto';
import { slugifyOrganizationName } from './utils/slug.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly organizationsRepository: OrganizationsRepository,
  ) {}

  async onboard(
    identity: SupabaseIdentity,
    dto: OnboardDto,
  ): Promise<OnboardResponse> {
    const existing = await this.usersRepository.findBySupabaseUserId(identity.supabaseUserId);
    if (existing) {
      throw new ConflictException('User already onboarded');
    }

    const email = (dto.email ?? identity.email).toLowerCase();
    const emailTaken = await this.usersRepository.findByEmail(email);
    if (emailTaken) {
      throw new ConflictException('Email already registered');
    }

    const user = await this.usersRepository.create({
      supabaseUserId: identity.supabaseUserId,
      email,
      name: dto.name.trim(),
      emailVerified: true,
    });

    const orgName = dto.organizationName?.trim() || `${dto.name.trim()}'s Company`;
    const { organization, membership } = await this.organizationsRepository.createWithOwner({
      name: orgName,
      slug: slugifyOrganizationName(orgName),
      ownerId: user.id,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        role: membership.role as OrganizationRole,
      },
    };
  }

  async getMe(userId: string): Promise<MeResponse> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const memberships = await this.organizationsRepository.findMembershipsForUser(userId);
    const organizations = await Promise.all(
      memberships.map(async (m) => {
        const org = await this.organizationsRepository.findOrganizationById(m.organizationId);
        if (!org) return null;
        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          role: m.role as OrganizationRole,
        };
      }),
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      organizations: organizations.filter((o): o is NonNullable<typeof o> => o !== null),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<MeResponse> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.usersRepository.updateName(userId, dto.name);
    return this.getMe(userId);
  }

  /**
   * Deletes Supabase Auth identity first (privacy), then app rows.
   * MVP: one account = one company — refuses if owned orgs have other members.
   */
  async deleteAccount(userId: string): Promise<void> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const ownedOrgs = await this.organizationsRepository.findOrganizationsOwnedByUser(userId);
    for (const org of ownedOrgs) {
      const memberCount = await this.organizationsRepository.countMembers(org.id);
      if (memberCount > 1) {
        throw new BadRequestException(
          'Cannot delete account while your company still has other members.',
        );
      }
    }

    const admin = this.createSupabaseAdminClient();
    const { error: authDeleteError } = await admin.auth.admin.deleteUser(user.supabaseUserId);
    if (authDeleteError) {
      this.logger.error(
        `Failed to delete Supabase auth user ${user.supabaseUserId}: ${authDeleteError.message}`,
      );
      throw new InternalServerErrorException('Could not delete account. Please try again.');
    }

    try {
      await this.usersRepository.deleteAccountCascade(userId);
    } catch (error) {
      this.logger.error(
        `Auth user ${user.supabaseUserId} deleted but app cascade failed for ${userId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new InternalServerErrorException(
        'Account sign-in was removed but cleanup failed. Contact support with your email.',
      );
    }

    this.logger.log(`Deleted account for user ${userId}`);
  }

  async resolveAuthenticatedUser(supabaseUserId: string, email?: string): Promise<AuthenticatedUser> {
    const user = await this.usersRepository.findBySupabaseUserId(supabaseUserId);
    if (!user) {
      throw new UnauthorizedException('User not onboarded');
    }

    return {
      supabaseUserId,
      userId: user.id,
      email: user.email ?? email ?? '',
    };
  }

  private createSupabaseAdminClient(): SupabaseClient {
    return createClient(getRequiredEnv('SUPABASE_URL'), getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
}
