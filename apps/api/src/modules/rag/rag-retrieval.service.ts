import { Injectable, Logger } from '@nestjs/common';
import type { AiActor } from '../ai/ai-actor';
import { AiService } from '../ai/ai.service';
import { DocumentChunksRepository, type RetrievedChunk } from './document-chunks.repository';

export const RAG_TOP_K = 6;
export const RAG_PROMPT_CHAR_BUDGET = 12_000;

@Injectable()
export class RagRetrievalService {
  private readonly logger = new Logger(RagRetrievalService.name);

  constructor(
    private readonly chunksRepository: DocumentChunksRepository,
    private readonly aiService: AiService,
  ) {}

  async retrieveForQuery(input: {
    actor: AiActor;
    organizationId: string;
    assistantId: string;
    query: string;
    topK?: number;
    signal?: AbortSignal;
    /** When false, skip OpenAI embed (no ready knowledge / no chunks needed). */
    hasReadyKnowledge?: boolean;
  }): Promise<RetrievedChunk[]> {
    if (input.hasReadyKnowledge === false) {
      return [];
    }

    const query = input.query.trim();
    if (!query) {
      return [];
    }

    if (input.signal?.aborted) {
      const abortErr = new Error('Aborted');
      abortErr.name = 'AbortError';
      throw abortErr;
    }

    try {
      const { embeddings } = await this.aiService.embed(input.actor, [query], input.signal);
      const queryEmbedding = embeddings[0];
      if (!queryEmbedding?.length) {
        return [];
      }

      if (input.signal?.aborted) {
        const abortErr = new Error('Aborted');
        abortErr.name = 'AbortError';
        throw abortErr;
      }

      return this.chunksRepository.similaritySearch({
        organizationId: input.organizationId,
        assistantId: input.assistantId,
        queryEmbedding,
        topK: input.topK ?? RAG_TOP_K,
      });
    } catch (error) {
      if (
        (error instanceof Error && error.name === 'AbortError') ||
        (typeof error === 'object' &&
          error !== null &&
          'name' in error &&
          (error as { name: string }).name === 'AbortError')
      ) {
        throw error;
      }
      this.logger.warn('RAG retrieval failed; caller should fallback', {
        name: error instanceof Error ? error.name : 'unknown',
      });
      return [];
    }
  }

  /** Formats retrieved chunks into a bounded prompt section. */
  formatKnowledgeContext(chunks: RetrievedChunk[], budget = RAG_PROMPT_CHAR_BUDGET): string {
    if (chunks.length === 0) {
      return '';
    }

    let remaining = budget;
    const parts: string[] = [];
    for (const chunk of chunks) {
      if (remaining <= 0) break;
      const meta =
        chunk.metadata && typeof chunk.metadata === 'object' && !Array.isArray(chunk.metadata)
          ? (chunk.metadata as Record<string, unknown>)
          : {};
      const title =
        typeof meta.sourceName === 'string' && meta.sourceName.trim()
          ? meta.sourceName.trim()
          : 'Knowledge';
      const text = chunk.content.slice(0, remaining);
      if (!text) continue;
      parts.push(`### ${title}\n${text}`);
      remaining -= text.length;
    }

    return parts.length > 0 ? `Knowledge:\n${parts.join('\n\n')}` : '';
  }
}
