import { randomBytes } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  InviteMemberResponse,
  OrganizationDetail,
  OrganizationInvitationDto,
  OrganizationInvitationsResponse,
  OrganizationMemberDto,
  OrganizationMembersResponse,
  OrganizationRole,
  OrganizationSummary,
  OrganizationsListResponse,
} from '@genie/types';
import { getWebAppOrigin } from '../../config/env';
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
const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

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

  /**
   * Invite by email: adds immediately if the user already onboarded,
   * otherwise creates a pending invitation with a shareable accept URL.
   */
  async inviteMember(
    actorUserId: string,
    organizationId: string,
    dto: AddOrganizationMemberDto,
  ): Promise<InviteMemberResponse> {
    const { membership: actor } = await this.requireMembership(actorUserId, organizationId);
    this.requireManager(actor.role);

    const email = dto.email.toLowerCase().trim();
    const role = dto.role ?? 'member';
    const user = await this.usersRepository.findByEmail(email);

    if (user) {
      const existing = await this.organizationsRepository.findMembership(user.id, organizationId);
      if (existing) {
        throw new ConflictException('User is already a member');
      }

      const created = await this.organizationsRepository.createMembership(
        organizationId,
        user.id,
        role,
      );

      const pending = await this.organizationsRepository.findPendingInvitationByEmail(
        organizationId,
        email,
      );
      if (pending) {
        await this.organizationsRepository.updateInvitationStatus(pending.id, 'accepted');
      }

      return {
        status: 'added',
        member: {
          userId: user.id,
          email: user.email,
          name: user.name,
          role: created.role as OrganizationRole,
          createdAt: created.createdAt.toISOString(),
        },
      };
    }

    const existingInvite = await this.organizationsRepository.findPendingInvitationByEmail(
      organizationId,
      email,
    );
    if (existingInvite) {
      throw new ConflictException('An invitation is already pending for this email');
    }

    const token = randomBytes(32).toString('hex');
    const invitation = await this.organizationsRepository.createInvitation({
      organizationId,
      email,
      role,
      token,
      invitedById: actorUserId,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    });

    return {
      status: 'invited',
      invitation: this.toInvitationDto(invitation),
    };
  }

  /** @deprecated use inviteMember — kept alias for clear controller naming */
  addMember(
    actorUserId: string,
    organizationId: string,
    dto: AddOrganizationMemberDto,
  ): Promise<InviteMemberResponse> {
    return this.inviteMember(actorUserId, organizationId, dto);
  }

  async listInvitations(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationInvitationsResponse> {
    const { membership } = await this.requireMembership(userId, organizationId);
    this.requireManager(membership.role);
    const invitations = await this.organizationsRepository.listPendingInvitations(organizationId);
    return {
      invitations: invitations.map((i) => this.toInvitationDto(i)),
    };
  }

  async revokeInvitation(
    userId: string,
    organizationId: string,
    invitationId: string,
  ): Promise<void> {
    const { membership } = await this.requireMembership(userId, organizationId);
    this.requireManager(membership.role);

    const invitations = await this.organizationsRepository.listPendingInvitations(organizationId);
    const target = invitations.find((i) => i.id === invitationId);
    if (!target) {
      throw new NotFoundException('Invitation not found');
    }

    await this.organizationsRepository.updateInvitationStatus(invitationId, 'revoked');
  }

  async acceptInvitation(userId: string, token: string): Promise<OrganizationMemberDto> {
    const invitation = await this.organizationsRepository.findInvitationByToken(token);
    if (!invitation || invitation.status !== 'pending') {
      throw new NotFoundException('Invitation not found or no longer valid');
    }

    if (invitation.expiresAt.getTime() < Date.now()) {
      await this.organizationsRepository.updateInvitationStatus(invitation.id, 'expired');
      throw new BadRequestException('Invitation has expired');
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenException('This invitation was sent to a different email address');
    }

    if (invitation.role === 'owner') {
      throw new BadRequestException('Invalid invitation role');
    }

    const existing = await this.organizationsRepository.findMembership(userId, invitation.organizationId);
    if (existing) {
      await this.organizationsRepository.updateInvitationStatus(invitation.id, 'accepted');
      return {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: existing.role as OrganizationRole,
        createdAt: existing.createdAt.toISOString(),
      };
    }

    const created = await this.organizationsRepository.createMembership(
      invitation.organizationId,
      userId,
      invitation.role as Exclude<OrganizationRole, 'owner'>,
    );
    await this.organizationsRepository.updateInvitationStatus(invitation.id, 'accepted');

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

  /**
   * Asserts the user is a member of the organization.
   * Public for cross-module use (e.g. AiService); throws 404/403 like org routes.
   * Happy path: one DB round-trip (membership + organization join).
   */
  async requireMembership(userId: string, organizationId: string) {
    const membership =
      await this.organizationsRepository.findMembershipWithOrganization(
        userId,
        organizationId,
      );

    if (membership) {
      return { organization: membership.organization, membership };
    }

    const organization =
      await this.organizationsRepository.findOrganizationById(organizationId);
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    throw new ForbiddenException('Not a member of this organization');
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

  private toInvitationDto(invitation: {
    id: string;
    organizationId: string;
    email: string;
    role: OrganizationRole;
    status: string;
    expiresAt: Date;
    createdAt: Date;
    token: string;
  }): OrganizationInvitationDto {
    return {
      id: invitation.id,
      organizationId: invitation.organizationId,
      email: invitation.email,
      role: invitation.role as Exclude<OrganizationRole, 'owner'>,
      status: invitation.status as OrganizationInvitationDto['status'],
      expiresAt: invitation.expiresAt.toISOString(),
      createdAt: invitation.createdAt.toISOString(),
      inviteUrl: `${getWebAppOrigin()}/invite/${invitation.token}`,
    };
  }
}
