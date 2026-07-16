import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { chunkText } from './chunking';
import { DocumentChunksRepository } from './document-chunks.repository';

const EMBED_BATCH_SIZE = 16;

@Injectable()
export class RagIngestionService {
  private readonly logger = new Logger(RagIngestionService.name);

  constructor(
    private readonly chunksRepository: DocumentChunksRepository,
    private readonly aiService: AiService,
  ) {}

  /**
   * Chunk + embed content for a knowledge source.
   * Caller owns KnowledgeSource status transitions.
   * Returns ready|failed; never throws.
   */
  async ingestKnowledgeSource(input: {
    userId: string;
    organizationId: string;
    assistantId: string;
    knowledgeSourceId: string;
    name: string;
    type: string;
    content: string;
  }): Promise<'ready' | 'failed'> {
    const { userId, organizationId, assistantId, knowledgeSourceId, name, type, content } = input;

    try {
      const chunks = chunkText(content);
      if (chunks.length === 0) {
        await this.chunksRepository.deleteByKnowledgeSource(organizationId, knowledgeSourceId);
        return 'failed';
      }

      await this.chunksRepository.deleteByKnowledgeSource(organizationId, knowledgeSourceId);

      const texts = chunks.map((c) => c.content);
      const embeddings: number[][] = [];
      let model = 'text-embedding-3-small';

      for (let i = 0; i < texts.length; i += EMBED_BATCH_SIZE) {
        const batch = texts.slice(i, i + EMBED_BATCH_SIZE);
        const result = await this.aiService.embed(userId, organizationId, batch);
        model = result.model;
        embeddings.push(...result.embeddings);
      }

      if (embeddings.length !== chunks.length) {
        throw new Error('Embedding count mismatch');
      }

      await this.chunksRepository.insertMany(
        chunks.map((chunk, i) => ({
          organizationId,
          assistantId,
          knowledgeSourceId,
          chunkIndex: chunk.index,
          content: chunk.content,
          metadata: {
            sourceName: name,
            type,
            chunkIndex: chunk.index,
          },
          embedding: embeddings[i]!,
          embeddingModel: model,
          embeddingVersion: model,
          tokenCount: chunk.tokenCount,
        })),
      );

      return 'ready';
    } catch (error) {
      this.logger.warn('Knowledge ingest failed', {
        knowledgeSourceId,
        name: error instanceof Error ? error.name : 'unknown',
      });
      try {
        await this.chunksRepository.deleteByKnowledgeSource(organizationId, knowledgeSourceId);
      } catch {
        // best-effort
      }
      return 'failed';
    }
  }
}
