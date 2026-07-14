import { Injectable } from '@nestjs/common';
import type { Organization, OrganizationMember, OrganizationRole, User } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  ownerId: string;
}

export type MembershipWithOrganization = OrganizationMember & {
  organization: Organization;
};

export type MembershipWithUser = OrganizationMember & {
  user: Pick<User, 'id' | 'email' | 'name'>;
};

@Injectable()
export class OrganizationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWithOwner(
    input: CreateOrganizationInput,
  ): Promise<{ organization: Organization; membership: OrganizationMember }> {
    return this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: input.name,
          slug: input.slug,
          ownerId: input.ownerId,
          plan: 'free',
        },
      });

      const membership = await tx.organizationMember.create({
        data: {
          userId: input.ownerId,
          organizationId: organization.id,
          role: 'owner',
        },
      });

      return { organization, membership };
    });
  }

  findMembershipsForUser(userId: string): Promise<OrganizationMember[]> {
    return this.prisma.organizationMember.findMany({ where: { userId } });
  }

  findMembershipsWithOrganizations(userId: string): Promise<MembershipWithOrganization[]> {
    return this.prisma.organizationMember.findMany({
      where: { userId },
      include: { organization: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  findOrganizationById(id: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({ where: { id } });
  }

  findMembership(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationMember | null> {
    return this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: { userId, organizationId },
      },
    });
  }

  findMembers(organizationId: string): Promise<MembershipWithUser[]> {
    return this.prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  updateOrganizationName(id: string, name: string): Promise<Organization> {
    return this.prisma.organization.update({
      where: { id },
      data: { name },
    });
  }

  createMembership(
    organizationId: string,
    userId: string,
    role: Exclude<OrganizationRole, 'owner'>,
  ): Promise<OrganizationMember> {
    return this.prisma.organizationMember.create({
      data: { organizationId, userId, role },
    });
  }

  updateMemberRole(
    organizationId: string,
    userId: string,
    role: Exclude<OrganizationRole, 'owner'>,
  ): Promise<OrganizationMember> {
    return this.prisma.organizationMember.update({
      where: { userId_organizationId: { userId, organizationId } },
      data: { role },
    });
  }

  deleteMembership(organizationId: string, userId: string): Promise<OrganizationMember> {
    return this.prisma.organizationMember.delete({
      where: { userId_organizationId: { userId, organizationId } },
    });
  }

  countOwners(organizationId: string): Promise<number> {
    return this.prisma.organizationMember.count({
      where: { organizationId, role: 'owner' },
    });
  }

  toOrganizationRole(role: OrganizationRole): OrganizationRole {
    return role;
  }
}
