import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface CreateUserInput {
  supabaseUserId: string;
  email: string;
  name: string;
  emailVerified?: boolean;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findBySupabaseUserId(supabaseUserId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { supabaseUserId } });
  }

  create(data: CreateUserInput): Promise<User> {
    return this.prisma.user.create({
      data: {
        supabaseUserId: data.supabaseUserId,
        email: data.email.toLowerCase(),
        name: data.name.trim(),
        emailVerified: data.emailVerified ?? false,
      },
    });
  }

  updateName(id: string, name: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { name: name.trim() },
    });
  }

  /**
   * Removes owned organizations (members first), remaining memberships, then the user row.
   * Caller must enforce product rules (e.g. sole member) before invoking.
   */
  async deleteAccountCascade(userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const ownedOrgs = await tx.organization.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });
      const ownedOrgIds = ownedOrgs.map((o) => o.id);

      if (ownedOrgIds.length > 0) {
        await tx.organizationMember.deleteMany({
          where: { organizationId: { in: ownedOrgIds } },
        });
        await tx.organization.deleteMany({
          where: { id: { in: ownedOrgIds } },
        });
      }

      await tx.organizationMember.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });
  }
}
