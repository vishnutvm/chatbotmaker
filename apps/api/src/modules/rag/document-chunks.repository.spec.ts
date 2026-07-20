import type { PrismaService } from '../../infrastructure/database/prisma.service';
import { DocumentChunksRepository } from './document-chunks.repository';

describe('DocumentChunksRepository', () => {
  const orgId = '550e8400-e29b-41d4-a716-446655440000';
  const assistantId = '660e8400-e29b-41d4-a716-446655440000';
  const knowledgeSourceId = '770e8400-e29b-41d4-a716-446655440000';

  let prisma: {
    $executeRaw: jest.Mock;
    $queryRaw: jest.Mock;
  };
  let repository: DocumentChunksRepository;

  beforeEach(() => {
    prisma = {
      $executeRaw: jest.fn().mockResolvedValue(undefined),
      $queryRaw: jest.fn(),
    };
    repository = new DocumentChunksRepository(prisma as unknown as PrismaService);
  });

  describe('deleteByKnowledgeSource', () => {
    it('executes tenant-scoped delete via prisma', async () => {
      await repository.deleteByKnowledgeSource(orgId, knowledgeSourceId);

      expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
    });
  });

  describe('insertMany', () => {
    it('returns early without calling prisma when chunks is empty', async () => {
      await repository.insertMany([]);

      expect(prisma.$executeRaw).not.toHaveBeenCalled();
    });

    it('inserts one batch via executeRaw', async () => {
      await repository.insertMany([
        {
          organizationId: orgId,
          assistantId,
          knowledgeSourceId,
          chunkIndex: 0,
          content: 'Refund policy excerpt.',
          metadata: { sourceName: 'Refunds' },
          embedding: [0.1, 0.2, 0.3],
          embeddingModel: 'text-embedding-3-small',
          embeddingVersion: 'v1',
          tokenCount: 12,
        },
      ]);

      expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
    });
  });

  describe('similaritySearch', () => {
    it('maps query rows to RetrievedChunk with numeric similarity', async () => {
      prisma.$queryRaw.mockResolvedValue([
        {
          id: '880e8400-e29b-41d4-a716-446655440000',
          content: 'Refunds within 30 days.',
          metadata: { sourceName: 'Refund policy' },
          similarity: '0.9125',
        },
      ]);

      const results = await repository.similaritySearch({
        organizationId: orgId,
        assistantId,
        queryEmbedding: [0.1, 0.2, 0.3],
        topK: 5,
      });

      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(results).toEqual([
        {
          id: '880e8400-e29b-41d4-a716-446655440000',
          content: 'Refunds within 30 days.',
          metadata: { sourceName: 'Refund policy' },
          similarity: 0.9125,
        },
      ]);
    });
  });

  describe('countByKnowledgeSource', () => {
    it('returns numeric count from bigint query result', async () => {
      prisma.$queryRaw.mockResolvedValue([{ count: BigInt(7) }]);

      const count = await repository.countByKnowledgeSource(orgId, knowledgeSourceId);

      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(count).toBe(7);
    });

    it('returns zero when query returns no rows', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      const count = await repository.countByKnowledgeSource(orgId, knowledgeSourceId);

      expect(count).toBe(0);
    });
  });
});
