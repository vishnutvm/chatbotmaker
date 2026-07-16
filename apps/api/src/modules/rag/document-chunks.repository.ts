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

@Injectable()
export class DocumentChunksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async deleteByKnowledgeSource(knowledgeSourceId: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM document_chunks WHERE document_id = ${knowledgeSourceId}::uuid
    `;
  }

  async insertMany(chunks: InsertChunkInput[]): Promise<void> {
    if (chunks.length === 0) {
      return;
    }

    for (const chunk of chunks) {
      const vectorLiteral = `[${chunk.embedding.join(',')}]`;
      const metadataJson = JSON.stringify(chunk.metadata);

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
        ) VALUES (
          ${chunk.organizationId}::uuid,
          ${chunk.assistantId}::uuid,
          ${chunk.knowledgeSourceId}::uuid,
          ${chunk.content},
          ${metadataJson}::jsonb,
          ${vectorLiteral}::vector,
          ${chunk.embeddingModel},
          ${chunk.embeddingVersion},
          ${chunk.tokenCount},
          ${chunk.chunkIndex},
          NOW(),
          NOW()
        )
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
  }): Promise<RetrievedChunk[]> {
    const vectorLiteral = `[${input.queryEmbedding.join(',')}]`;
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

  async countByKnowledgeSource(knowledgeSourceId: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM document_chunks
      WHERE document_id = ${knowledgeSourceId}::uuid
    `;
    return Number(rows[0]?.count ?? 0);
  }
}
