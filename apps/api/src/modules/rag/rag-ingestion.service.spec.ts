import { RagIngestionService } from './rag-ingestion.service';
import type { AiService } from '../ai/ai.service';
import type { DocumentChunksRepository } from './document-chunks.repository';

describe('RagIngestionService', () => {
  const userId = 'user-1';
  const organizationId = 'org-1';
  const assistantId = 'asst-1';
  const knowledgeSourceId = 'ks-1';

  let chunksRepository: {
    deleteByKnowledgeSource: jest.Mock;
    insertMany: jest.Mock;
  };
  let aiService: { embed: jest.Mock };
  let service: RagIngestionService;

  beforeEach(() => {
    chunksRepository = {
      deleteByKnowledgeSource: jest.fn().mockResolvedValue(undefined),
      insertMany: jest.fn().mockResolvedValue(undefined),
    };
    aiService = {
      embed: jest.fn().mockResolvedValue({
        embeddings: [[0.1, 0.2]],
        model: 'text-embedding-3-small',
      }),
    };
    service = new RagIngestionService(
      chunksRepository as unknown as DocumentChunksRepository,
      aiService as unknown as AiService,
    );
  });

  it('returns failed and deletes chunks when content yields no chunks', async () => {
    const status = await service.ingestKnowledgeSource({
      userId,
      organizationId,
      assistantId,
      knowledgeSourceId,
      name: 'Empty',
      type: 'text',
      content: '   ',
    });

    expect(status).toBe('failed');
    expect(chunksRepository.deleteByKnowledgeSource).toHaveBeenCalledWith(
      organizationId,
      knowledgeSourceId,
    );
    expect(aiService.embed).not.toHaveBeenCalled();
    expect(chunksRepository.insertMany).not.toHaveBeenCalled();
  });

  it('chunks, embeds, inserts, and returns ready', async () => {
    const status = await service.ingestKnowledgeSource({
      userId,
      organizationId,
      assistantId,
      knowledgeSourceId,
      name: 'Policy',
      type: 'text',
      content: 'Refunds within 30 days.',
    });

    expect(status).toBe('ready');
    expect(aiService.embed).toHaveBeenCalled();
    expect(chunksRepository.insertMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          organizationId,
          assistantId,
          knowledgeSourceId,
          content: expect.stringContaining('Refunds'),
          embedding: [0.1, 0.2],
        }),
      ]),
    );
  });

  it('returns failed and cleans up when embed throws', async () => {
    aiService.embed.mockRejectedValue(new Error('provider down'));

    const status = await service.ingestKnowledgeSource({
      userId,
      organizationId,
      assistantId,
      knowledgeSourceId,
      name: 'Policy',
      type: 'text',
      content: 'Refunds within 30 days.',
    });

    expect(status).toBe('failed');
    expect(chunksRepository.deleteByKnowledgeSource).toHaveBeenCalled();
    expect(chunksRepository.insertMany).not.toHaveBeenCalled();
  });

  it('returns failed when embedding count mismatches chunk count', async () => {
    aiService.embed.mockResolvedValue({ embeddings: [], model: 'text-embedding-3-small' });

    const status = await service.ingestKnowledgeSource({
      userId,
      organizationId,
      assistantId,
      knowledgeSourceId,
      name: 'Policy',
      type: 'text',
      content: 'Refunds within 30 days.',
    });

    expect(status).toBe('failed');
  });
});
