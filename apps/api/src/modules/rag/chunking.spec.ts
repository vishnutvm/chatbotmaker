import { chunkText, CHUNK_SIZE_CHARS, CHUNK_OVERLAP_CHARS } from './chunking';

describe('chunkText', () => {
  it('returns empty for blank input', () => {
    expect(chunkText('')).toEqual([]);
    expect(chunkText('   \n\t  ')).toEqual([]);
  });

  it('returns a single chunk for short text', () => {
    const chunks = chunkText('Hello world knowledge.');
    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.index).toBe(0);
    expect(chunks[0]?.content).toContain('Hello world');
    expect(chunks[0]?.tokenCount).toBeGreaterThan(0);
  });

  it('splits long text with overlap and respects maxChunks', () => {
    const long = 'a'.repeat(CHUNK_SIZE_CHARS * 3);
    const chunks = chunkText(long, {
      sizeChars: CHUNK_SIZE_CHARS,
      overlapChars: CHUNK_OVERLAP_CHARS,
      maxChunks: 2,
    });
    expect(chunks).toHaveLength(2);
    expect(chunks[0]?.content.length).toBeLessThanOrEqual(CHUNK_SIZE_CHARS);
    expect(chunks[1]?.index).toBe(1);
  });
});
