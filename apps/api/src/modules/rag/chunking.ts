export type TextChunk = {
  index: number;
  content: string;
  tokenCount: number;
};

/** Approx chars per token for budget estimates (OpenAI-ish English). */
const CHARS_PER_TOKEN = 4;

/** ~800 tokens target chunk size. */
export const CHUNK_SIZE_CHARS = 800 * CHARS_PER_TOKEN;
/** ~100 token overlap. */
export const CHUNK_OVERLAP_CHARS = 100 * CHARS_PER_TOKEN;
/** Hard cap so a 100k source cannot explode embed cost. */
export const MAX_CHUNKS_PER_SOURCE = 200;

/**
 * Splits normalized text into overlapping chunks.
 * Empty / whitespace-only input yields no chunks.
 */
export function chunkText(
  raw: string,
  options?: {
    sizeChars?: number;
    overlapChars?: number;
    maxChunks?: number;
  },
): TextChunk[] {
  const size = options?.sizeChars ?? CHUNK_SIZE_CHARS;
  const overlap = Math.min(options?.overlapChars ?? CHUNK_OVERLAP_CHARS, size - 1);
  const maxChunks = options?.maxChunks ?? MAX_CHUNKS_PER_SOURCE;

  const text = raw.replace(/\s+/g, ' ').trim();
  if (!text) {
    return [];
  }

  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < text.length && index < maxChunks) {
    const end = Math.min(start + size, text.length);
    const content = text.slice(start, end).trim();
    if (content) {
      chunks.push({
        index,
        content,
        tokenCount: Math.max(1, Math.ceil(content.length / CHARS_PER_TOKEN)),
      });
      index += 1;
    }
    if (end >= text.length) {
      break;
    }
    start = Math.max(0, end - overlap);
  }

  return chunks;
}
