import { NotFoundException } from '@nestjs/common';
import { WidgetChatService } from './widget-chat.service';

describe('WidgetChatService', () => {
  let assistantsService: {
    requireLivePublicAssistant: jest.Mock;
    streamLivePublicChat: jest.Mock;
  };
  let publishableKeysService: { markUsed: jest.Mock };
  let rateLimiter: { assertChat: jest.Mock };
  let service: WidgetChatService;

  const keyCtx = { keyId: 'key-1', organizationId: 'org-1' };
  const dto = {
    assistantId: '770e8400-e29b-41d4-a716-446655440000',
    messages: [{ role: 'user' as const, content: 'Hello' }],
  };
  const liveAssistant = {
    id: dto.assistantId,
    organizationId: 'org-1',
    status: 'live',
    knowledgeSources: [],
  };

  beforeEach(() => {
    assistantsService = {
      requireLivePublicAssistant: jest.fn().mockResolvedValue(liveAssistant),
      streamLivePublicChat: jest.fn(async function* () {
        yield {
          event: 'meta' as const,
          data: { model: 'gpt-4o-mini' },
        };
        yield { event: 'delta' as const, data: { content: 'Hi' } };
        yield {
          event: 'done' as const,
          data: {
            finishReason: 'stop',
            usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
          },
        };
      }),
    };
    publishableKeysService = { markUsed: jest.fn().mockResolvedValue(undefined) };
    rateLimiter = { assertChat: jest.fn() };
    service = new WidgetChatService(
      assistantsService as never,
      publishableKeysService as never,
      rateLimiter as never,
    );
  });

  it('resolves live assistant before rate limit, then marks used and streams', async () => {
    const callOrder: string[] = [];
    assistantsService.requireLivePublicAssistant.mockImplementation(async () => {
      callOrder.push('resolve');
      return liveAssistant;
    });
    rateLimiter.assertChat.mockImplementation(() => {
      callOrder.push('rateLimit');
    });
    publishableKeysService.markUsed.mockImplementation(() => {
      callOrder.push('markUsed');
      return Promise.resolve();
    });
    assistantsService.streamLivePublicChat.mockImplementation(async function* () {
      callOrder.push('stream');
      yield { event: 'meta' as const, data: { model: 'gpt-4o-mini' } };
    });

    const events = [];
    for await (const event of service.streamChat(keyCtx, dto, undefined, '1.2.3.4')) {
      events.push(event);
    }

    expect(callOrder).toEqual(['resolve', 'rateLimit', 'markUsed', 'stream']);
    expect(rateLimiter.assertChat).toHaveBeenCalledWith('key-1', 'org-1', '1.2.3.4');
    expect(publishableKeysService.markUsed).toHaveBeenCalledWith('key-1');
    expect(assistantsService.streamLivePublicChat).toHaveBeenCalledWith(
      'org-1',
      dto.assistantId,
      { messages: dto.messages },
      undefined,
      liveAssistant,
    );
    expect(events.map((e) => e.event)).toEqual(['meta']);
  });

  it('does not burn chat quota when assistant resolve returns 404', async () => {
    assistantsService.requireLivePublicAssistant.mockRejectedValue(
      new NotFoundException('Assistant not found'),
    );

    await expect(async () => {
      for await (const _ of service.streamChat(keyCtx, dto)) {
        // drain
      }
    }).rejects.toBeInstanceOf(NotFoundException);

    expect(rateLimiter.assertChat).not.toHaveBeenCalled();
    expect(publishableKeysService.markUsed).not.toHaveBeenCalled();
    expect(assistantsService.streamLivePublicChat).not.toHaveBeenCalled();
  });

  it('does not call assistant stream when rate limit throws', async () => {
    rateLimiter.assertChat.mockImplementation(() => {
      throw Object.assign(new Error('rl'), { status: 429 });
    });

    await expect(async () => {
      for await (const _ of service.streamChat(keyCtx, dto)) {
        // drain
      }
    }).rejects.toMatchObject({ status: 429 });

    expect(assistantsService.requireLivePublicAssistant).toHaveBeenCalled();
    expect(assistantsService.streamLivePublicChat).not.toHaveBeenCalled();
    expect(publishableKeysService.markUsed).not.toHaveBeenCalled();
  });

  it('propagates NotFoundException from assistants stream', async () => {
    assistantsService.streamLivePublicChat.mockImplementation(async function* () {
      throw new NotFoundException('Assistant not found');
      yield undefined as never;
    });

    await expect(async () => {
      for await (const _ of service.streamChat(keyCtx, dto)) {
        // drain
      }
    }).rejects.toBeInstanceOf(NotFoundException);
  });
});
