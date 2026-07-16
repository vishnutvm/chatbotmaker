import { RagRetrievalService } from './rag-retrieval.service';

describe('RagRetrievalService.formatKnowledgeContext', () => {
  const service = new RagRetrievalService({} as never, {} as never);

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
