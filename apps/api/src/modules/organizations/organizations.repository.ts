import { Injectable } from '@nestjs/common';
import type { Organization, OrganizationMember, OrganizationRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  ownerId: string;
}

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

  toOrganizationRole(role: OrganizationRole): OrganizationRole {
    return role;
  }
}
