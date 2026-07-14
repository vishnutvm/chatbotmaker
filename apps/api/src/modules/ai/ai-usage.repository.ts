import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export type AiUsageCreateInput = {
  organizationId: string;
  userId: string | null;
  provider: string;
  model: string;
  operation: 'chat' | 'chat_stream';
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  latencyMs: number | null;
  status: 'success' | 'error';
  errorCode: string | null;
};

@Injectable()
export class AiUsageRepository {
  private readonly logger = new Logger(AiUsageRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Best-effort usage insert. Never throws to callers — log failures only.
   */
  async create(input: AiUsageCreateInput): Promise<void> {
    try {
      await this.prisma.aiUsageEvent.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          provider: input.provider,
          model: input.model,
          operation: input.operation,
          promptTokens: input.promptTokens,
          completionTokens: input.completionTokens,
          totalTokens: input.totalTokens,
          latencyMs: input.latencyMs,
          status: input.status,
          errorCode: input.errorCode,
        },
      });
    } catch (error) {
      this.logger.warn('Failed to persist ai_usage_events row', {
        organizationId: input.organizationId,
        operation: input.operation,
        status: input.status,
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }
}
