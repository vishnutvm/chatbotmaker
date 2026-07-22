import { Injectable } from '@nestjs/common';
import type { PublishableApiKey, Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class PublishableKeysRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.PublishableApiKeyUncheckedCreateInput): Promise<PublishableApiKey> {
    return this.prisma.publishableApiKey.create({ data });
  }

  findManyByOrganization(organizationId: string): Promise<PublishableApiKey[]> {
    return this.prisma.publishableApiKey.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByIdInOrganization(
    organizationId: string,
    id: string,
  ): Promise<PublishableApiKey | null> {
    return this.prisma.publishableApiKey.findFirst({
      where: { id, organizationId },
    });
  }

  findActiveByHash(keyHash: string): Promise<PublishableApiKey | null> {
    return this.prisma.publishableApiKey.findFirst({
      where: { keyHash, revokedAt: null },
    });
  }

  revoke(id: string, revokedAt: Date = new Date()): Promise<PublishableApiKey> {
    return this.prisma.publishableApiKey.update({
      where: { id },
      data: { revokedAt },
    });
  }

  touchLastUsed(id: string, at: Date = new Date()): Promise<PublishableApiKey> {
    return this.prisma.publishableApiKey.update({
      where: { id },
      data: { lastUsedAt: at },
    });
  }
}
