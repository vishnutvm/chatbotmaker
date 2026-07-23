import { Injectable } from '@nestjs/common';
import type { AiSseEvent } from '../ai/ai.service';
import { AssistantsService } from '../assistants/assistants.service';
import { PublishableKeyRateLimiter } from '../publishable-keys/publishable-key-rate-limiter';
import { PublishableKeysService } from '../publishable-keys/publishable-keys.service';
import type { WidgetChatStreamDto } from './dto/widget-chat-stream.dto';
import type { PublishableKeyRequestContext } from './guards/publishable-key.guard';

@Injectable()
export class WidgetChatService {
  constructor(
    private readonly assistantsService: AssistantsService,
    private readonly publishableKeysService: PublishableKeysService,
    private readonly rateLimiter: PublishableKeyRateLimiter,
  ) {}

  /**
   * Public widget SSE chat.
   * Resolve live same-org assistant first (404 without burning chat quota),
   * then rate-limit + markUsed, then stream.
   */
  async *streamChat(
    keyCtx: PublishableKeyRequestContext,
    dto: WidgetChatStreamDto,
    signal?: AbortSignal,
    clientIp?: string,
  ): AsyncGenerator<AiSseEvent> {
    const assistant = await this.assistantsService.requireLivePublicAssistant(
      keyCtx.organizationId,
      dto.assistantId,
    );

    this.rateLimiter.assertChat(keyCtx.keyId, keyCtx.organizationId, clientIp);
    void this.publishableKeysService.markUsed(keyCtx.keyId);

    yield* this.assistantsService.streamLivePublicChat(
      keyCtx.organizationId,
      dto.assistantId,
      { messages: dto.messages },
      signal,
      assistant,
    );
  }
}
