import { AiUsageRepository } from './ai-usage.repository';
import type { PrismaService } from '../../infrastructure/database/prisma.service';

describe('AiUsageRepository', () => {
  it('persists usage events', async () => {
    const create = jest.fn().mockResolvedValue({});
    const repo = new AiUsageRepository({
      aiUsageEvent: { create },
    } as unknown as PrismaService);

    await repo.create({
      organizationId: 'org-1',
      userId: 'user-1',
      provider: 'openai',
      model: 'gpt-4o-mini',
      operation: 'embed',
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
      latencyMs: 12,
      status: 'success',
      errorCode: null,
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: 'org-1',
          operation: 'embed',
          status: 'success',
        }),
      }),
    );
  });

  it('swallows persistence errors without throwing', async () => {
    const create = jest.fn().mockRejectedValue(new Error('db down'));
    const repo = new AiUsageRepository({
      aiUsageEvent: { create },
    } as unknown as PrismaService);

    await expect(
      repo.create({
        organizationId: 'org-1',
        userId: null,
        provider: 'openai',
        model: 'gpt-4o-mini',
        operation: 'chat',
        promptTokens: 1,
        completionTokens: 1,
        totalTokens: 2,
        latencyMs: 1,
        status: 'error',
        errorCode: 'AI_PROVIDER_ERROR',
      }),
    ).resolves.toBeUndefined();
  });

  it('logs unknown when persistence rejects a non-Error value', async () => {
    const create = jest.fn().mockRejectedValue('db-string-failure');
    const repo = new AiUsageRepository({
      aiUsageEvent: { create },
    } as unknown as PrismaService);

    await expect(
      repo.create({
        organizationId: 'org-1',
        userId: 'user-1',
        provider: 'openai',
        model: 'gpt-4o-mini',
        operation: 'chat_stream',
        promptTokens: null,
        completionTokens: null,
        totalTokens: null,
        latencyMs: null,
        status: 'success',
        errorCode: null,
      }),
    ).resolves.toBeUndefined();
  });
});
