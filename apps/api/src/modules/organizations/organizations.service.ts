import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  OrganizationDetail,
  OrganizationMemberDto,
  OrganizationMembersResponse,
  OrganizationRole,
  OrganizationSummary,
  OrganizationsListResponse,
} from '@genie/types';
import { UsersRepository } from '../users/users.repository';
import { slugifyOrganizationName } from '../auth/utils/slug.util';
import type {
  AddOrganizationMemberDto,
  CreateOrganizationDto,
  UpdateOrganizationDto,
  UpdateOrganizationMemberDto,
} from './dto/organizations.dto';
import { OrganizationsRepository } from './organizations.repository';

const MANAGER_ROLES: OrganizationRole[] = ['owner', 'admin'];

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async listForUser(userId: string): Promise<OrganizationsListResponse> {
    const memberships =
      await this.organizationsRepository.findMembershipsWithOrganizations(userId);

    return {
      organizations: memberships.map((m) => this.toSummary(m.organization, m.role)),
    };
  }

  async create(userId: string, dto: CreateOrganizationDto): Promise<OrganizationDetail> {
    const name = dto.name.trim();
    const { organization, membership } = await this.organizationsRepository.createWithOwner({
      name,
      slug: slugifyOrganizationName(name),
      ownerId: userId,
    });

    return this.toDetail(organization, membership.role);
  }

  async getForUser(userId: string, organizationId: string): Promise<OrganizationDetail> {
    const { organization, membership } = await this.requireMembership(userId, organizationId);
    return this.toDetail(organization, membership.role);
  }

  async updateForUser(
    userId: string,
    organizationId: string,
    dto: UpdateOrganizationDto,
  ): Promise<OrganizationDetail> {
    const { membership } = await this.requireMembership(userId, organizationId);
    this.requireManager(membership.role);

    if (!dto.name?.trim()) {
      throw new BadRequestException('name is required');
    }

    const organization = await this.organizationsRepository.updateOrganizationName(
      organizationId,
      dto.name.trim(),
    );

    return this.toDetail(organization, membership.role);
  }

  async listMembers(userId: string, organizationId: string): Promise<OrganizationMembersResponse> {
    await this.requireMembership(userId, organizationId);
    const members = await this.organizationsRepository.findMembers(organizationId);
    return {
      members: members.map((m) => this.toMemberDto(m)),
    };
  }

  async addMember(
    actorUserId: string,
    organizationId: string,
    dto: AddOrganizationMemberDto,
  ): Promise<OrganizationMemberDto> {
    const { membership: actor } = await this.requireMembership(actorUserId, organizationId);
    this.requireManager(actor.role);

    const email = dto.email.toLowerCase();
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found — they must sign up and onboard first');
    }

    const existing = await this.organizationsRepository.findMembership(user.id, organizationId);
    if (existing) {
      throw new ConflictException('User is already a member');
    }

    const role = dto.role ?? 'member';
    const created = await this.organizationsRepository.createMembership(
      organizationId,
      user.id,
      role,
    );

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: created.role as OrganizationRole,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async updateMemberRole(
    actorUserId: string,
    organizationId: string,
    targetUserId: string,
    dto: UpdateOrganizationMemberDto,
  ): Promise<OrganizationMemberDto> {
    const { membership: actor } = await this.requireMembership(actorUserId, organizationId);
    this.requireManager(actor.role);

    const target = await this.organizationsRepository.findMembership(targetUserId, organizationId);
    if (!target) {
      throw new NotFoundException('Member not found');
    }

    if (target.role === 'owner') {
      throw new ForbiddenException('Cannot change the owner role via this endpoint');
    }

    const updated = await this.organizationsRepository.updateMemberRole(
      organizationId,
      targetUserId,
      dto.role,
    );
    const user = await this.usersRepository.findById(targetUserId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: updated.role as OrganizationRole,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async removeMember(
    actorUserId: string,
    organizationId: string,
    targetUserId: string,
  ): Promise<void> {
    const { membership: actor } = await this.requireMembership(actorUserId, organizationId);
    const isSelf = actorUserId === targetUserId;

    if (!isSelf) {
      this.requireManager(actor.role);
    }

    const target = await this.organizationsRepository.findMembership(targetUserId, organizationId);
    if (!target) {
      throw new NotFoundException('Member not found');
    }

    if (target.role === 'owner') {
      const owners = await this.organizationsRepository.countOwners(organizationId);
      if (owners <= 1) {
        throw new ForbiddenException('Cannot remove the sole owner');
      }
    }

    await this.organizationsRepository.deleteMembership(organizationId, targetUserId);
  }

  private async requireMembership(userId: string, organizationId: string) {
    const organization = await this.organizationsRepository.findOrganizationById(organizationId);
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const membership = await this.organizationsRepository.findMembership(userId, organizationId);
    if (!membership) {
      throw new ForbiddenException('Not a member of this organization');
    }

    return { organization, membership };
  }

  private requireManager(role: OrganizationRole): void {
    if (!MANAGER_ROLES.includes(role)) {
      throw new ForbiddenException('Owner or admin role required');
    }
  }

  private toSummary(
    organization: { id: string; name: string; slug: string; plan: string; createdAt: Date },
    role: OrganizationRole,
  ): OrganizationSummary {
    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      role: role as OrganizationRole,
      plan: organization.plan,
      createdAt: organization.createdAt.toISOString(),
    };
  }

  private toDetail(
    organization: {
      id: string;
      name: string;
      slug: string;
      plan: string;
      ownerId: string;
      createdAt: Date;
      updatedAt: Date;
    },
    role: OrganizationRole,
  ): OrganizationDetail {
    return {
      ...this.toSummary(organization, role),
      ownerId: organization.ownerId,
      updatedAt: organization.updatedAt.toISOString(),
    };
  }

  private toMemberDto(m: {
    userId: string;
    role: OrganizationRole;
    createdAt: Date;
    user: { id: string; email: string; name: string };
  }): OrganizationMemberDto {
    return {
      userId: m.user.id,
      email: m.user.email,
      name: m.user.name,
      role: m.role as OrganizationRole,
      createdAt: m.createdAt.toISOString(),
    };
  }
}
