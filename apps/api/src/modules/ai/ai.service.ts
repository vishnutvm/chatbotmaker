import {
  BadGatewayException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  AIProvider,
  ChatMessage,
  ChatResult,
  ChatUsage,
} from '../../infrastructure/ai/ai.interface';
import { AI_PROVIDER } from '../../infrastructure/ai/ai.interface';
import { getOpenAiApiKey } from '../../config/env';
import { OrganizationsService } from '../organizations/organizations.service';
import { AiRateLimiter } from './ai-rate-limiter';
import { AiUsageRepository } from './ai-usage.repository';
import type { ChatCompletionDto } from './dto/chat-completion.dto';
import { ModelRouter } from './model-router';
import { PromptAssembler } from './prompt.assembler';

const DEFAULT_MAX_TOKENS = 1024;

export type ChatCompletionResponse = {
  id: string;
  organizationId: string;
  model: string;
  content: string;
  finishReason: string | null;
  usage: ChatUsage;
};

export type AiSseEvent =
  | { event: 'meta'; data: { organizationId: string; model: string } }
  | { event: 'delta'; data: { content: string } }
  | {
      event: 'done';
      data: { finishReason: string | null; usage: ChatUsage };
    }
  | {
      event: 'error';
      data: { statusCode: number; code: string; message: string };
    };

type PreparedChat = {
  organizationId: string;
  userId: string;
  model: string;
  messages: ChatMessage[];
  maxTokens: number;
  temperature?: number;
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: AIProvider,
    private readonly organizationsService: OrganizationsService,
    private readonly promptAssembler: PromptAssembler,
    private readonly modelRouter: ModelRouter,
    private readonly usageRepository: AiUsageRepository,
    private readonly rateLimiter: AiRateLimiter,
  ) {}

  async complete(
    userId: string,
    organizationId: string,
    dto: ChatCompletionDto,
  ): Promise<ChatCompletionResponse> {
    const prepared = await this.prepare(userId, organizationId, dto);
    const startedAt = Date.now();

    try {
      const result = await this.aiProvider.chat({
        model: prepared.model,
        messages: prepared.messages,
        maxTokens: prepared.maxTokens,
        temperature: prepared.temperature,
      });

      this.logUsageFireAndForget({
        organizationId,
        userId,
        model: prepared.model,
        operation: 'chat',
        usage: result.usage,
        latencyMs: Date.now() - startedAt,
        status: 'success',
        errorCode: null,
      });

      return this.toResponse(organizationId, prepared.model, result);
    } catch (error) {
      this.logUsageFireAndForget({
        organizationId,
        userId,
        model: prepared.model,
        operation: 'chat',
        usage: { promptTokens: null, completionTokens: null, totalTokens: null },
        latencyMs: Date.now() - startedAt,
        status: 'error',
        errorCode: this.errorCode(error),
      });
      throw error;
    }
  }

  /**
   * Yields SSE events. Auth / membership / rate-limit / validation failures throw
   * before the first yield so the controller can return normal HTTP errors.
   */
  async *stream(
    userId: string,
    organizationId: string,
    dto: ChatCompletionDto,
    signal?: AbortSignal,
  ): AsyncGenerator<AiSseEvent> {
    const prepared = await this.prepare(userId, organizationId, dto);
    const startedAt = Date.now();

    yield {
      event: 'meta',
      data: { organizationId, model: prepared.model },
    };

    let usage: ChatUsage = {
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
    };
    let finishReason: string | null = null;
    let sawDone = false;

    try {
      for await (const chunk of this.aiProvider.stream({
        model: prepared.model,
        messages: prepared.messages,
        maxTokens: prepared.maxTokens,
        temperature: prepared.temperature,
        signal,
      })) {
        if (signal?.aborted) {
          break;
        }

        if (chunk.type === 'delta') {
          yield { event: 'delta', data: { content: chunk.content } };
        } else if (chunk.type === 'done') {
          sawDone = true;
          finishReason = chunk.finishReason;
          usage = chunk.usage;
          yield {
            event: 'done',
            data: { finishReason, usage },
          };
        }
      }

      if (!sawDone && !signal?.aborted) {
        yield {
          event: 'done',
          data: { finishReason, usage },
        };
      }

      if (!signal?.aborted) {
        this.logUsageFireAndForget({
          organizationId,
          userId,
          model: prepared.model,
          operation: 'chat_stream',
          usage,
          latencyMs: Date.now() - startedAt,
          status: 'success',
          errorCode: null,
        });
      }
    } catch (error) {
      if (signal?.aborted || this.isAbortError(error)) {
        return;
      }

      const mapped = this.mapStreamError(error);
      this.logUsageFireAndForget({
        organizationId,
        userId,
        model: prepared.model,
        operation: 'chat_stream',
        usage,
        latencyMs: Date.now() - startedAt,
        status: 'error',
        errorCode: mapped.code,
      });

      yield {
        event: 'error',
        data: mapped,
      };
    }
  }

  /**
   * Batch-embed texts via AIProvider. Membership + rate limit + usage metering apply.
   */
  async embed(
    userId: string,
    organizationId: string,
    texts: string[],
  ): Promise<{ embeddings: number[][]; model: string }> {
    if (texts.length === 0) {
      return { embeddings: [], model: this.resolveEmbeddingModel() };
    }

    await this.organizationsService.requireMembership(userId, organizationId);
    this.rateLimiter.assertWithinLimits(userId, organizationId);
    this.assertAiConfigured();

    const model = this.resolveEmbeddingModel();
    const startedAt = Date.now();

    try {
      const raw = await this.aiProvider.embed(texts);
      const embeddings = Array.isArray(raw[0])
        ? (raw as number[][])
        : ([raw] as number[][]);

      this.logUsageFireAndForget({
        organizationId,
        userId,
        model,
        operation: 'embed',
        usage: {
          promptTokens: null,
          completionTokens: null,
          totalTokens: null,
        },
        latencyMs: Date.now() - startedAt,
        status: 'success',
        errorCode: null,
      });

      return { embeddings, model };
    } catch (error) {
      this.logUsageFireAndForget({
        organizationId,
        userId,
        model,
        operation: 'embed',
        usage: { promptTokens: null, completionTokens: null, totalTokens: null },
        latencyMs: Date.now() - startedAt,
        status: 'error',
        errorCode: this.errorCode(error),
      });
      throw error;
    }
  }

  private resolveEmbeddingModel(): string {
    return process.env.AI_EMBEDDING_MODEL?.trim() || 'text-embedding-3-small';
  }

  private async prepare(
    userId: string,
    organizationId: string,
    dto: ChatCompletionDto,
  ): Promise<PreparedChat> {
    await this.organizationsService.requireMembership(userId, organizationId);
    this.rateLimiter.assertWithinLimits(userId, organizationId);
    this.assertAiConfigured();

    const messages = this.promptAssembler.assemble(dto);
    const model = this.modelRouter.resolveChatModel(organizationId);
    const maxTokens = dto.maxTokens ?? DEFAULT_MAX_TOKENS;

    return {
      organizationId,
      userId,
      model,
      messages,
      maxTokens,
      temperature: dto.temperature,
    };
  }

  /** Fail closed before SSE headers / provider I/O when the API key is missing. */
  private assertAiConfigured(): void {
    if (!getOpenAiApiKey()) {
      throw new ServiceUnavailableException({
        statusCode: 503,
        code: 'AI_NOT_CONFIGURED',
        message: 'AI provider is not configured',
      });
    }
  }

  private toResponse(
    organizationId: string,
    model: string,
    result: ChatResult,
  ): ChatCompletionResponse {
    return {
      id: result.id || `chatcmpl_${randomUUID().replace(/-/g, '')}`,
      organizationId,
      model: result.model || model,
      content: result.content ?? '',
      finishReason: result.finishReason,
      usage: result.usage,
    };
  }

  private logUsageFireAndForget(input: {
    organizationId: string;
    userId: string;
    model: string;
    operation: 'chat' | 'chat_stream' | 'embed';
    usage: ChatUsage;
    latencyMs: number;
    status: 'success' | 'error';
    errorCode: string | null;
  }): void {
    void this.usageRepository
      .create({
        organizationId: input.organizationId,
        userId: input.userId,
        provider: 'openai',
        model: input.model,
        operation: input.operation,
        promptTokens: input.usage.promptTokens,
        completionTokens: input.usage.completionTokens,
        totalTokens: input.usage.totalTokens,
        latencyMs: input.latencyMs,
        status: input.status,
        errorCode: input.errorCode,
      })
      .catch(() => undefined);
  }

  private errorCode(error: unknown): string {
    if (error instanceof ServiceUnavailableException) {
      return 'AI_NOT_CONFIGURED';
    }
    if (error instanceof BadGatewayException) {
      return 'AI_PROVIDER_ERROR';
    }
    return 'AI_ERROR';
  }

  private mapStreamError(error: unknown): {
    statusCode: number;
    code: string;
    message: string;
  } {
    if (error instanceof ServiceUnavailableException) {
      return {
        statusCode: 503,
        code: 'AI_NOT_CONFIGURED',
        message: 'AI provider is not configured',
      };
    }

    if (error instanceof BadGatewayException) {
      return {
        statusCode: 502,
        code: 'AI_PROVIDER_ERROR',
        message: 'Upstream model request failed',
      };
    }

    this.logger.warn('Unexpected AI stream error', {
      name: error instanceof Error ? error.name : 'unknown',
    });

    return {
      statusCode: 502,
      code: 'AI_PROVIDER_ERROR',
      message: 'Upstream model request failed',
    };
  }

  private isAbortError(error: unknown): boolean {
    return (
      (error instanceof Error && error.name === 'AbortError') ||
      (typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        (error as { name: string }).name === 'AbortError')
    );
  }
}

// Intentionally no ChatStreamChunk export — consumers use infrastructure/ai interfaces.
