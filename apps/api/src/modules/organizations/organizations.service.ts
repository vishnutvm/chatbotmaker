import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  OrganizationDetail,
  OrganizationRole,
  OrganizationSummary,
  OrganizationsListResponse,
} from '@genie/types';
import { slugifyOrganizationName } from '../auth/utils/slug.util';
import type { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organizations.dto';
import { OrganizationsRepository } from './organizations.repository';

@Injectable()
export class OrganizationsService {
  constructor(private readonly organizationsRepository: OrganizationsRepository) {}

  async listForUser(userId: string): Promise<OrganizationsListResponse> {
    const memberships =
      await this.organizationsRepository.findMembershipsWithOrganizations(userId);

    return {
      organizations: memberships.map((m) => this.toSummary(m.organization, m.role)),
    };
  }

  async create(userId: string, dto: CreateOrganizationDto): Promise<OrganizationDetail> {
    const existingCount = await this.organizationsRepository.countMembershipsForUser(userId);
    if (existingCount > 0) {
      throw new ConflictException('Account already has a company — one company per account');
    }

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
    this.requireOwner(membership.role);

    if (!dto.name?.trim()) {
      throw new BadRequestException('name is required');
    }

    const organization = await this.organizationsRepository.updateOrganizationName(
      organizationId,
      dto.name.trim(),
    );

    return this.toDetail(organization, membership.role);
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

  private requireOwner(role: OrganizationRole): void {
    if (role !== 'owner') {
      throw new ForbiddenException('Owner role required');
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
}
