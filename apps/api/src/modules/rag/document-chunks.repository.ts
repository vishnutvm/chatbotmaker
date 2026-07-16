import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export type RetrievedChunk = {
  id: string;
  content: string;
  metadata: Prisma.JsonValue;
  similarity: number;
};

export type InsertChunkInput = {
  organizationId: string;
  assistantId: string;
  knowledgeSourceId: string;
  chunkIndex: number;
  content: string;
  metadata: Record<string, unknown>;
  embedding: number[];
  embeddingModel: string;
  embeddingVersion: string;
  tokenCount: number;
};

/** Soft floor — below this, prefer dump fallback over weak matches. */
export const RAG_MIN_SIMILARITY = 0.25;

@Injectable()
export class DocumentChunksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async deleteByKnowledgeSource(
    organizationId: string,
    knowledgeSourceId: string,
  ): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM document_chunks
      WHERE organization_id = ${organizationId}::uuid
        AND document_id = ${knowledgeSourceId}::uuid
    `;
  }

  async insertMany(chunks: InsertChunkInput[]): Promise<void> {
    if (chunks.length === 0) {
      return;
    }

    // Batch multi-row inserts to keep latency bounded (avoid 1 RTT per chunk).
    const BATCH = 40;
    for (let i = 0; i < chunks.length; i += BATCH) {
      const batch = chunks.slice(i, i + BATCH);
      const values = batch.map(
        (chunk) => Prisma.sql`(
          ${chunk.organizationId}::uuid,
          ${chunk.assistantId}::uuid,
          ${chunk.knowledgeSourceId}::uuid,
          ${chunk.content},
          ${JSON.stringify(chunk.metadata)}::jsonb,
          ${`[${chunk.embedding.join(',')}]`}::vector,
          ${chunk.embeddingModel},
          ${chunk.embeddingVersion},
          ${chunk.tokenCount},
          ${chunk.chunkIndex},
          NOW(),
          NOW()
        )`,
      );

      await this.prisma.$executeRaw`
        INSERT INTO document_chunks (
          organization_id,
          knowledge_base_id,
          document_id,
          content,
          metadata,
          embedding,
          embedding_model,
          embedding_version,
          token_count,
          chunk_index,
          created_at,
          updated_at
        ) VALUES ${Prisma.join(values)}
        ON CONFLICT (document_id, chunk_index) DO UPDATE SET
          content = EXCLUDED.content,
          metadata = EXCLUDED.metadata,
          embedding = EXCLUDED.embedding,
          embedding_model = EXCLUDED.embedding_model,
          embedding_version = EXCLUDED.embedding_version,
          token_count = EXCLUDED.token_count,
          updated_at = NOW()
      `;
    }
  }

  /**
   * Tenant-filtered similarity search.
   * knowledge_base_id = assistantId (MVP alias).
   */
  async similaritySearch(input: {
    organizationId: string;
    assistantId: string;
    queryEmbedding: number[];
    topK: number;
    minSimilarity?: number;
  }): Promise<RetrievedChunk[]> {
    const vectorLiteral = `[${input.queryEmbedding.join(',')}]`;
    const minSimilarity = input.minSimilarity ?? RAG_MIN_SIMILARITY;
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        content: string;
        metadata: Prisma.JsonValue;
        similarity: number;
      }>
    >`
      SELECT id, content, metadata,
             (1 - (embedding <=> ${vectorLiteral}::vector))::float8 AS similarity
      FROM document_chunks
      WHERE organization_id = ${input.organizationId}::uuid
        AND knowledge_base_id = ${input.assistantId}::uuid
        AND embedding IS NOT NULL
        AND (1 - (embedding <=> ${vectorLiteral}::vector)) >= ${minSimilarity}
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT ${input.topK}
    `;

    return rows.map((row) => ({
      id: row.id,
      content: row.content,
      metadata: row.metadata,
      similarity: Number(row.similarity),
    }));
  }

  async countByKnowledgeSource(
    organizationId: string,
    knowledgeSourceId: string,
  ): Promise<number> {
    const rows = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM document_chunks
      WHERE organization_id = ${organizationId}::uuid
        AND document_id = ${knowledgeSourceId}::uuid
    `;
    return Number(rows[0]?.count ?? 0);
  }
}
