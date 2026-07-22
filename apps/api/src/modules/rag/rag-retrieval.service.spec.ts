import type { AiService } from '../ai/ai.service';
import type { DocumentChunksRepository } from './document-chunks.repository';
import { RagRetrievalService, RAG_TOP_K } from './rag-retrieval.service';

describe('RagRetrievalService', () => {
  let chunksRepository: jest.Mocked<Pick<DocumentChunksRepository, 'similaritySearch'>>;
  let aiService: jest.Mocked<Pick<AiService, 'embed'>>;
  let service: RagRetrievalService;

  const baseInput = {
    userId: 'user-1',
    organizationId: 'org-1',
    assistantId: 'asst-1',
    query: 'refund policy',
  };

  beforeEach(() => {
    chunksRepository = {
      similaritySearch: jest.fn(),
    };
    aiService = {
      embed: jest.fn(),
    };
    service = new RagRetrievalService(
      chunksRepository as unknown as DocumentChunksRepository,
      aiService as unknown as AiService,
    );
  });

  describe('formatKnowledgeContext', () => {
    it('returns empty string for no chunks', () => {
      expect(service.formatKnowledgeContext([])).toBe('');
    });

    it('formats chunks with source titles within budget', () => {
      const result = service.formatKnowledgeContext(
        [
          {
            id: '1',
            content: 'Refunds within 30 days.',
            metadata: { sourceName: 'Refund policy' },
            similarity: 0.9,
          },
          {
            id: '2',
            content: 'Extra detail that may be truncated.',
            metadata: { sourceName: 'FAQ' },
            similarity: 0.8,
          },
        ],
        40,
      );

      expect(result.startsWith('Knowledge:')).toBe(true);
      expect(result).toContain('### Refund policy');
      expect(result).toContain('Refunds within 30 days.');
    });
  });

  describe('retrieveForQuery', () => {
    it('returns empty array for empty query without calling embed', async () => {
      const result = await service.retrieveForQuery({ ...baseInput, query: '' });

      expect(result).toEqual([]);
      expect(aiService.embed).not.toHaveBeenCalled();
      expect(chunksRepository.similaritySearch).not.toHaveBeenCalled();
    });

    it('returns empty array for whitespace-only query without calling embed', async () => {
      const result = await service.retrieveForQuery({ ...baseInput, query: '   \t  ' });

      expect(result).toEqual([]);
      expect(aiService.embed).not.toHaveBeenCalled();
      expect(chunksRepository.similaritySearch).not.toHaveBeenCalled();
    });

    it('embeds query and returns chunks from similaritySearch', async () => {
      const queryEmbedding = [0.1, 0.2, 0.3];
      const chunks = [
        {
          id: 'chunk-1',
          content: 'Refunds within 30 days.',
          metadata: { sourceName: 'Refund policy' },
          similarity: 0.92,
        },
      ];

      aiService.embed.mockResolvedValue({
        embeddings: [queryEmbedding],
        model: 'text-embedding-3-small',
      });
      chunksRepository.similaritySearch.mockResolvedValue(chunks);

      const result = await service.retrieveForQuery(baseInput);

      expect(aiService.embed).toHaveBeenCalledWith('user-1', 'org-1', ['refund policy']);
      expect(chunksRepository.similaritySearch).toHaveBeenCalledWith({
        organizationId: 'org-1',
        assistantId: 'asst-1',
        queryEmbedding,
        topK: RAG_TOP_K,
      });
      expect(result).toEqual(chunks);
    });

    it('passes custom topK to similaritySearch', async () => {
      aiService.embed.mockResolvedValue({
        embeddings: [[0.5, 0.6]],
        model: 'text-embedding-3-small',
      });
      chunksRepository.similaritySearch.mockResolvedValue([]);

      await service.retrieveForQuery({ ...baseInput, topK: 3 });

      expect(chunksRepository.similaritySearch).toHaveBeenCalledWith(
        expect.objectContaining({ topK: 3 }),
      );
    });

    it('returns empty array when embed returns no vector', async () => {
      aiService.embed.mockResolvedValue({
        embeddings: [[]],
        model: 'text-embedding-3-small',
      });

      const result = await service.retrieveForQuery(baseInput);

      expect(result).toEqual([]);
      expect(chunksRepository.similaritySearch).not.toHaveBeenCalled();
    });

    it('returns empty array when embed throws', async () => {
      aiService.embed.mockRejectedValue(new Error('upstream unavailable'));

      const result = await service.retrieveForQuery(baseInput);

      expect(result).toEqual([]);
      expect(chunksRepository.similaritySearch).not.toHaveBeenCalled();
    });

    it('returns empty array when embed throws a non-Error value', async () => {
      aiService.embed.mockRejectedValue('string failure');

      const result = await service.retrieveForQuery(baseInput);

      expect(result).toEqual([]);
    });
  });

  describe('formatKnowledgeContext edges', () => {
    it('uses Knowledge title when metadata is missing or non-object', () => {
      const result = service.formatKnowledgeContext([
        { id: '1', content: 'Plain chunk', metadata: null, similarity: 0.5 },
        { id: '2', content: 'Array meta', metadata: [] as never, similarity: 0.4 },
      ]);

      expect(result).toContain('### Knowledge');
      expect(result).toContain('Plain chunk');
    });

    it('skips empty content chunks and stops when budget is exhausted', () => {
      const result = service.formatKnowledgeContext(
        [
          { id: '1', content: '', metadata: { sourceName: 'Empty' }, similarity: 0.9 },
          {
            id: '2',
            content: 'ABCDEFGHIJ',
            metadata: { sourceName: 'First' },
            similarity: 0.8,
          },
          {
            id: '3',
            content: 'SHOULD_NOT_APPEAR',
            metadata: { sourceName: 'Second' },
            similarity: 0.7,
          },
        ],
        10,
      );

      expect(result).toContain('### First');
      expect(result).not.toContain('SHOULD_NOT_APPEAR');
      expect(result).not.toContain('### Empty');
    });
  });
});
