import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { MeResponse, OnboardResponse, OrganizationRole } from '@genie/types';
import { OrganizationsRepository } from '../organizations/organizations.repository';
import { UsersRepository } from '../users/users.repository';
import type { OnboardDto } from './dto/auth.dto';
import { slugifyOrganizationName } from './utils/slug.util';
import type { AuthenticatedUser, SupabaseIdentity } from '../../common/types/jwt-payload';

@Injectable()
export class AuthService {
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
}
