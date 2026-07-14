import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import OpenAI from 'openai';
import { getAiDefaultModel, getOpenAiApiKey } from '../../config/env';
import type {
  AIProvider,
  ChatMessage,
  ChatParams,
  ChatResult,
  ChatStreamChunk,
  ChatUsage,
} from './ai.interface';

@Injectable()
export class OpenAiProvider implements AIProvider {
  private readonly logger = new Logger(OpenAiProvider.name);
  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    const apiKey = getOpenAiApiKey();
    if (!apiKey) {
      throw new ServiceUnavailableException({
        statusCode: 503,
        code: 'AI_NOT_CONFIGURED',
        message: 'AI provider is not configured',
      });
    }

    if (!this.client) {
      this.client = new OpenAI({
        apiKey,
        timeout: 60_000,
        maxRetries: 1,
      });
    }

    return this.client;
  }

  async chat(params: ChatParams): Promise<ChatResult> {
    const client = this.getClient();

    try {
      const response = await client.chat.completions.create(
        {
          model: params.model,
          messages: this.toOpenAiMessages(params.messages),
          max_tokens: params.maxTokens,
          ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
        },
        params.signal ? { signal: params.signal } : undefined,
      );

      const choice = response.choices[0];
      return {
        id: response.id || this.fallbackId(),
        model: response.model || params.model,
        content: choice?.message?.content ?? '',
        finishReason: choice?.finish_reason ?? null,
        usage: this.mapUsage(response.usage),
      };
    } catch (error) {
      this.rethrowProviderError(error);
    }
  }

  async *stream(params: ChatParams): AsyncIterable<ChatStreamChunk> {
    const client = this.getClient();

    let stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
    try {
      stream = await client.chat.completions.create(
        {
          model: params.model,
          messages: this.toOpenAiMessages(params.messages),
          max_tokens: params.maxTokens,
          stream: true,
          stream_options: { include_usage: true },
          ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
        },
        params.signal ? { signal: params.signal } : undefined,
      );
    } catch (error) {
      this.rethrowProviderError(error);
    }

    let finishReason: string | null = null;
    let usage: ChatUsage = {
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
    };
    let completionId: string | undefined;

    try {
      for await (const chunk of stream) {
        if (params.signal?.aborted) {
          break;
        }

        if (chunk.id) {
          completionId = chunk.id;
        }

        if (chunk.usage) {
          usage = this.mapUsage(chunk.usage);
        }

        const choice = chunk.choices[0];
        if (choice?.finish_reason) {
          finishReason = choice.finish_reason;
        }

        const delta = choice?.delta?.content;
        if (delta) {
          yield { type: 'delta', content: delta };
        }
      }
    } catch (error) {
      this.rethrowProviderError(error);
    }

    yield {
      type: 'done',
      finishReason,
      usage,
      id: completionId,
    };
  }

  async embed(input: string | string[]): Promise<number[] | number[][]> {
    const client = this.getClient();
    const model = process.env.AI_EMBEDDING_MODEL?.trim() || 'text-embedding-3-small';

    try {
      const response = await client.embeddings.create({
        model,
        input,
      });

      const vectors = response.data
        .slice()
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);

      return Array.isArray(input) ? vectors : (vectors[0] ?? []);
    } catch (error) {
      this.rethrowProviderError(error);
    }
  }

  /** Visible for tests — default model used when env unset. */
  getDefaultModel(): string {
    return getAiDefaultModel();
  }

  private toOpenAiMessages(
    messages: ChatMessage[],
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    return messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));
  }

  private mapUsage(
    usage:
      | {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
        }
      | null
      | undefined,
  ): ChatUsage {
    if (!usage) {
      return { promptTokens: null, completionTokens: null, totalTokens: null };
    }

    return {
      promptTokens: usage.prompt_tokens ?? null,
      completionTokens: usage.completion_tokens ?? null,
      totalTokens: usage.total_tokens ?? null,
    };
  }

  private fallbackId(): string {
    return `chatcmpl_${randomUUID().replace(/-/g, '')}`;
  }

  private rethrowProviderError(error: unknown): never {
    if (
      error instanceof ServiceUnavailableException &&
      (error.getResponse() as { code?: string })?.code === 'AI_NOT_CONFIGURED'
    ) {
      throw error;
    }

    const aborted =
      (error instanceof Error && error.name === 'AbortError') ||
      (typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        (error as { name: string }).name === 'AbortError');

    if (aborted) {
      throw error;
    }

    this.logger.warn('OpenAI provider request failed', {
      name: error instanceof Error ? error.name : 'unknown',
    });

    throw new BadGatewayException({
      statusCode: 502,
      code: 'AI_PROVIDER_ERROR',
      message: 'Upstream model request failed',
    });
  }
}
