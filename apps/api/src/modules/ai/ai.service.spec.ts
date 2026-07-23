import {
  BadGatewayException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { AIProvider, ChatResult } from '../../infrastructure/ai/ai.interface';
import type { OrganizationsService } from '../organizations/organizations.service';
import { AiRateLimiter } from './ai-rate-limiter';
import { AiService } from './ai.service';
import type { AiUsageRepository } from './ai-usage.repository';
import { ModelRouter } from './model-router';
import { PromptAssembler } from './prompt.assembler';

describe('AiService', () => {
  let aiProvider: jest.Mocked<AIProvider>;
  let organizationsService: { requireMembership: jest.Mock };
  let usageRepository: { create: jest.Mock };
  let rateLimiter: AiRateLimiter;
  let service: AiService;

  const orgId = '550e8400-e29b-41d4-a716-446655440000';
  const userId = '660e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    aiProvider = {
      chat: jest.fn(),
      stream: jest.fn(),
      embed: jest.fn(),
    };

    organizationsService = {
      requireMembership: jest.fn().mockResolvedValue({
        organization: { id: orgId },
        membership: { role: 'member' },
      }),
    };

    usageRepository = {
      create: jest.fn().mockResolvedValue(undefined),
    };

    rateLimiter = new AiRateLimiter();
    rateLimiter.reset();

    service = new AiService(
      aiProvider,
      organizationsService as unknown as OrganizationsService,
      new PromptAssembler(),
      new ModelRouter(),
      usageRepository as unknown as AiUsageRepository,
      rateLimiter,
    );

    process.env.AI_DEFAULT_MODEL = 'gpt-4o-mini';
    process.env.OPENAI_API_KEY = 'sk-test-unit';
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it('completes chat after membership check and records usage', async () => {
    const result: ChatResult = {
      id: 'chatcmpl_test',
      model: 'gpt-4o-mini',
      content: 'Hello there',
      finishReason: 'stop',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    };
    aiProvider.chat.mockResolvedValue(result);

    const response = await service.complete(userId, orgId, {
      messages: [{ role: 'user', content: 'Hi' }],
    });

    expect(organizationsService.requireMembership).toHaveBeenCalledWith(userId, orgId);
    expect(aiProvider.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-mini',
        maxTokens: 1024,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    );
    expect(response).toEqual({
      id: 'chatcmpl_test',
      organizationId: orgId,
      model: 'gpt-4o-mini',
      content: 'Hello there',
      finishReason: 'stop',
      usage: result.usage,
    });

    await Promise.resolve();
    expect(usageRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        userId,
        operation: 'chat',
        status: 'success',
        totalTokens: 15,
      }),
    );
  });

  it('propagates membership failures', async () => {
    organizationsService.requireMembership.mockRejectedValue(
      new ForbiddenException('Not a member of this organization'),
    );

    await expect(
      service.complete(userId, orgId, {
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(aiProvider.chat).not.toHaveBeenCalled();
  });

  it('records error usage then rethrows provider failures', async () => {
    aiProvider.chat.mockRejectedValue(
      new BadGatewayException({
        statusCode: 502,
        code: 'AI_PROVIDER_ERROR',
        message: 'Upstream model request failed',
      }),
    );

    await expect(
      service.complete(userId, orgId, {
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    ).rejects.toBeInstanceOf(BadGatewayException);

    await Promise.resolve();
    expect(usageRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        errorCode: 'AI_PROVIDER_ERROR',
      }),
    );
  });

  it('does not fail the response when usage logging fails', async () => {
    usageRepository.create.mockImplementation(async () => {
      throw new Error('db down');
    });
    aiProvider.chat.mockResolvedValue({
      id: 'chatcmpl_ok',
      model: 'gpt-4o-mini',
      content: 'ok',
      finishReason: 'stop',
      usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    });

    await expect(
      service.complete(userId, orgId, {
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    ).resolves.toMatchObject({ content: 'ok' });
  });

  it('streams meta, delta, done events', async () => {
    aiProvider.stream.mockImplementation(async function* () {
      yield { type: 'delta' as const, content: 'Hello ' };
      yield { type: 'delta' as const, content: 'world' };
      yield {
        type: 'done' as const,
        finishReason: 'stop',
        usage: { promptTokens: 2, completionTokens: 2, totalTokens: 4 },
      };
    });

    const events = [];
    for await (const event of service.stream(userId, orgId, {
      messages: [{ role: 'user', content: 'Hi' }],
    })) {
      events.push(event);
    }

    expect(events[0]).toEqual({
      event: 'meta',
      data: { organizationId: orgId, model: 'gpt-4o-mini' },
    });
    expect(events[1]).toEqual({ event: 'delta', data: { content: 'Hello ' } });
    expect(events[2]).toEqual({ event: 'delta', data: { content: 'world' } });
    expect(events[3]).toEqual({
      event: 'done',
      data: {
        finishReason: 'stop',
        usage: { promptTokens: 2, completionTokens: 2, totalTokens: 4 },
      },
    });
  });

  it('emits SSE error event on mid-stream provider failure', async () => {
    aiProvider.stream.mockImplementation(async function* () {
      yield { type: 'delta' as const, content: 'partial' };
      throw new BadGatewayException({
        statusCode: 502,
        code: 'AI_PROVIDER_ERROR',
        message: 'Upstream model request failed',
      });
    });

    const events = [];
    for await (const event of service.stream(userId, orgId, {
      messages: [{ role: 'user', content: 'Hi' }],
    })) {
      events.push(event);
    }

    expect(events.at(-1)).toEqual({
      event: 'error',
      data: {
        statusCode: 502,
        code: 'AI_PROVIDER_ERROR',
        message: 'Upstream model request failed',
      },
    });
  });

  it('throws 503 before yielding SSE when OpenAI key is missing', async () => {
    delete process.env.OPENAI_API_KEY;

    const events: unknown[] = [];
    await expect(
      (async () => {
        for await (const event of service.stream(userId, orgId, {
          messages: [{ role: 'user', content: 'Hi' }],
        })) {
          events.push(event);
        }
      })(),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    expect(events).toHaveLength(0);
    expect(aiProvider.stream).not.toHaveBeenCalled();
  });

  it('embeds texts after membership check and records embed usage', async () => {
    aiProvider.embed.mockResolvedValue([
      [0.1, 0.2],
      [0.3, 0.4],
    ]);

    const result = await service.embed(userId, orgId, ['hello', 'world']);

    expect(organizationsService.requireMembership).toHaveBeenCalledWith(userId, orgId);
    expect(aiProvider.embed).toHaveBeenCalledWith(['hello', 'world']);
    expect(result.embeddings).toEqual([
      [0.1, 0.2],
      [0.3, 0.4],
    ]);
    expect(result.model).toBe('text-embedding-3-small');

    await Promise.resolve();
    expect(usageRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        userId,
        operation: 'embed',
        status: 'success',
      }),
    );
  });

  it('enforces per-user rate limit before calling the provider', async () => {
    aiProvider.chat.mockResolvedValue({
      id: 'chatcmpl_rl',
      model: 'gpt-4o-mini',
      content: 'ok',
      finishReason: 'stop',
      usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    });

    for (let i = 0; i < 30; i += 1) {
      await service.complete(`${userId}-rl`, orgId, {
        messages: [{ role: 'user', content: 'Hi' }],
      });
    }

    await expect(
      service.complete(`${userId}-rl`, orgId, {
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    ).rejects.toMatchObject({ status: 429 });

    expect(aiProvider.chat).toHaveBeenCalledTimes(30);
  });

  it('returns empty embeddings without calling provider for empty input', async () => {
    const result = await service.embed(userId, orgId, []);
    expect(result.embeddings).toEqual([]);
    expect(aiProvider.embed).not.toHaveBeenCalled();
  });

  it('normalizes a single embedding vector into a batch array', async () => {
    aiProvider.embed.mockResolvedValue([0.1, 0.2] as never);

    const result = await service.embed(userId, orgId, ['hello']);
    expect(result.embeddings).toEqual([[0.1, 0.2]]);
  });

  it('records embed errors then rethrows', async () => {
    aiProvider.embed.mockRejectedValue(
      new BadGatewayException({
        statusCode: 502,
        code: 'AI_PROVIDER_ERROR',
        message: 'Upstream model request failed',
      }),
    );

    await expect(service.embed(userId, orgId, ['hello'])).rejects.toBeInstanceOf(
      BadGatewayException,
    );

    await Promise.resolve();
    expect(usageRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'embed',
        status: 'error',
        errorCode: 'AI_PROVIDER_ERROR',
      }),
    );
  });

  it('emits synthetic done when stream ends without a done chunk', async () => {
    aiProvider.stream.mockImplementation(async function* () {
      yield { type: 'delta' as const, content: 'only' };
    });

    const events = [];
    for await (const event of service.stream(userId, orgId, {
      messages: [{ role: 'user', content: 'Hi' }],
    })) {
      events.push(event);
    }

    expect(events.at(-1)).toEqual({
      event: 'done',
      data: {
        finishReason: null,
        usage: { promptTokens: null, completionTokens: null, totalTokens: null },
      },
    });
  });

  it('maps unexpected stream errors to AI_PROVIDER_ERROR SSE', async () => {
    aiProvider.stream.mockImplementation(async function* () {
      throw new Error('boom');
    });

    const events = [];
    for await (const event of service.stream(userId, orgId, {
      messages: [{ role: 'user', content: 'Hi' }],
    })) {
      events.push(event);
    }

    expect(events.at(-1)).toEqual({
      event: 'error',
      data: {
        statusCode: 502,
        code: 'AI_PROVIDER_ERROR',
        message: 'Upstream model request failed',
      },
    });
  });

  it('stops streaming quietly when the signal aborts mid-stream', async () => {
    const controller = new AbortController();
    aiProvider.stream.mockImplementation(async function* () {
      yield { type: 'delta' as const, content: 'A' };
      controller.abort();
      yield { type: 'delta' as const, content: 'B' };
    });

    const events = [];
    for await (const event of service.stream(
      userId,
      orgId,
      { messages: [{ role: 'user', content: 'Hi' }] },
      controller.signal,
    )) {
      events.push(event);
    }

    expect(events.map((e) => e.event)).toEqual(['meta', 'delta']);
  });

  it('swallows AbortError from the provider without emitting SSE error', async () => {
    const abortErr = new Error('aborted');
    abortErr.name = 'AbortError';
    aiProvider.stream.mockImplementation(async function* () {
      throw abortErr;
    });

    const events = [];
    for await (const event of service.stream(userId, orgId, {
      messages: [{ role: 'user', content: 'Hi' }],
    })) {
      events.push(event);
    }

    expect(events.map((e) => e.event)).toEqual(['meta']);
    expect(usageRepository.create).not.toHaveBeenCalled();
  });

  it('swallows provider throws when the abort signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    aiProvider.stream.mockImplementation(async function* () {
      throw new Error('client gone');
    });

    const events = [];
    for await (const event of service.stream(
      userId,
      orgId,
      { messages: [{ role: 'user', content: 'Hi' }] },
      controller.signal,
    )) {
      events.push(event);
    }

    expect(events.map((e) => e.event)).toEqual(['meta']);
  });

  it('maps ServiceUnavailableException from provider.chat to AI_NOT_CONFIGURED usage', async () => {
    aiProvider.chat.mockRejectedValue(
      new ServiceUnavailableException({
        statusCode: 503,
        code: 'AI_NOT_CONFIGURED',
        message: 'AI provider is not configured',
      }),
    );

    await expect(
      service.complete(userId, orgId, { messages: [{ role: 'user', content: 'Hi' }] }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    await Promise.resolve();
    expect(usageRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        errorCode: 'AI_NOT_CONFIGURED',
      }),
    );
  });

  it('maps unexpected complete failures to AI_ERROR usage code', async () => {
    aiProvider.chat.mockRejectedValue(new Error('socket hang up'));

    await expect(
      service.complete(userId, orgId, { messages: [{ role: 'user', content: 'Hi' }] }),
    ).rejects.toThrow('socket hang up');

    await Promise.resolve();
    expect(usageRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        errorCode: 'AI_ERROR',
      }),
    );
  });

  it('maps ServiceUnavailableException mid-stream to AI_NOT_CONFIGURED SSE', async () => {
    aiProvider.stream.mockImplementation(async function* () {
      throw new ServiceUnavailableException({
        statusCode: 503,
        code: 'AI_NOT_CONFIGURED',
        message: 'AI provider is not configured',
      });
    });

    const events = [];
    for await (const event of service.stream(userId, orgId, {
      messages: [{ role: 'user', content: 'Hi' }],
    })) {
      events.push(event);
    }

    expect(events.at(-1)).toEqual({
      event: 'error',
      data: {
        statusCode: 503,
        code: 'AI_NOT_CONFIGURED',
        message: 'AI provider is not configured',
      },
    });
  });

  it('fills missing provider id/model/content when mapping chat response', async () => {
    aiProvider.chat.mockResolvedValue({
      id: '',
      model: '',
      content: undefined as unknown as string,
      finishReason: 'stop',
      usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    });

    const response = await service.complete(userId, orgId, {
      messages: [{ role: 'user', content: 'Hi' }],
    });

    expect(response.id).toMatch(/^chatcmpl_[a-f0-9]+$/);
    expect(response.model).toBe('gpt-4o-mini');
    expect(response.content).toBe('');
  });
});
