import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { DocumentChunksRepository } from './document-chunks.repository';
import { RagIngestionService } from './rag-ingestion.service';
import { RagRetrievalService } from './rag-retrieval.service';

@Module({
  imports: [AiModule],
  providers: [DocumentChunksRepository, RagIngestionService, RagRetrievalService],
  exports: [RagIngestionService, RagRetrievalService, DocumentChunksRepository],
})
export class RagModule {}
