import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Organization,
  OrganizationDocument,
  OrganizationMember,
  OrganizationMemberDocument,
} from './schemas/organization.schema';

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  ownerId: Types.ObjectId;
}

@Injectable()
export class OrganizationsRepository {
  constructor(
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
    @InjectModel(OrganizationMember.name)
    private readonly memberModel: Model<OrganizationMemberDocument>,
  ) {}

  async createWithOwner(
    input: CreateOrganizationInput,
  ): Promise<{ organization: OrganizationDocument; membership: OrganizationMemberDocument }> {
    const organization = await this.organizationModel.create({
      name: input.name,
      slug: input.slug,
      ownerId: input.ownerId,
      plan: 'free',
    });

    try {
      const membership = await this.memberModel.create({
        userId: input.ownerId,
        organizationId: organization._id,
        role: 'owner',
      });
      return { organization, membership };
    } catch (error) {
      await this.organizationModel.deleteOne({ _id: organization._id });
      throw error;
    }
  }

  findMembershipsForUser(userId: string): Promise<OrganizationMemberDocument[]> {
    return this.memberModel.find({ userId: new Types.ObjectId(userId) }).exec();
  }

  findOrganizationById(id: string): Promise<OrganizationDocument | null> {
    return this.organizationModel.findById(id).exec();
  }
}
