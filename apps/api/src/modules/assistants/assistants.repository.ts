import { Injectable } from '@nestjs/common';
import type { Assistant, KnowledgeSource, Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export type AssistantWithCount = Assistant & { _count: { knowledgeSources: number } };
export type AssistantWithKnowledge = Assistant & { knowledgeSources: KnowledgeSource[] };

const COUNT_INCLUDE = { _count: { select: { knowledgeSources: true } } } as const;

@Injectable()
export class AssistantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyByOrganization(organizationId: string): Promise<AssistantWithCount[]> {
    return this.prisma.assistant.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' },
      include: COUNT_INCLUDE,
    });
  }

  findById(organizationId: string, id: string): Promise<AssistantWithCount | null> {
    return this.prisma.assistant.findFirst({
      where: { id, organizationId },
      include: COUNT_INCLUDE,
    });
  }

  findByIdWithKnowledge(organizationId: string, id: string): Promise<AssistantWithKnowledge | null> {
    return this.prisma.assistant.findFirst({
      where: { id, organizationId },
      include: { knowledgeSources: { orderBy: { createdAt: 'desc' } } },
    });
  }

  findByIdWithReadyKnowledge(
    organizationId: string,
    id: string,
  ): Promise<AssistantWithKnowledge | null> {
    return this.prisma.assistant.findFirst({
      where: { id, organizationId },
      include: {
        knowledgeSources: { where: { status: 'ready' }, orderBy: { createdAt: 'desc' } },
      },
    });
  }

  create(data: Prisma.AssistantUncheckedCreateInput): Promise<AssistantWithCount> {
    return this.prisma.assistant.create({ data, include: COUNT_INCLUDE });
  }

  update(id: string, data: Prisma.AssistantUpdateInput): Promise<AssistantWithCount> {
    return this.prisma.assistant.update({ where: { id }, data, include: COUNT_INCLUDE });
  }

  delete(id: string): Promise<Assistant> {
    return this.prisma.assistant.delete({ where: { id } });
  }

  createKnowledgeSource(
    data: Prisma.KnowledgeSourceUncheckedCreateInput,
  ): Promise<KnowledgeSource> {
    return this.prisma.knowledgeSource.create({ data });
  }

  findKnowledgeByAssistant(assistantId: string): Promise<KnowledgeSource[]> {
    return this.prisma.knowledgeSource.findMany({
      where: { assistantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findKnowledgeById(id: string): Promise<KnowledgeSource | null> {
    return this.prisma.knowledgeSource.findUnique({ where: { id } });
  }

  updateKnowledgeSource(
    id: string,
    data: Prisma.KnowledgeSourceUpdateInput,
  ): Promise<KnowledgeSource> {
    return this.prisma.knowledgeSource.update({ where: { id }, data });
  }

  deleteKnowledgeSource(id: string): Promise<KnowledgeSource> {
    return this.prisma.knowledgeSource.delete({ where: { id } });
  }
}
