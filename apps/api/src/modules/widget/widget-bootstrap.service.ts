import { Injectable, NotFoundException } from '@nestjs/common';
import type { WidgetBootstrapDto } from '@genie/types';
import { AssistantsService } from '../assistants/assistants.service';
import { PublishableKeyRateLimiter } from '../publishable-keys/publishable-key-rate-limiter';
import { PublishableKeysService } from '../publishable-keys/publishable-keys.service';
import type { PublishableKeyRequestContext } from './guards/publishable-key.guard';

@Injectable()
export class WidgetBootstrapService {
  constructor(
    private readonly assistantsService: AssistantsService,
    private readonly publishableKeysService: PublishableKeysService,
    private readonly rateLimiter: PublishableKeyRateLimiter,
  ) {}

  async bootstrap(
    keyCtx: PublishableKeyRequestContext,
    assistantId: string,
  ): Promise<WidgetBootstrapDto> {
    this.rateLimiter.assertWithinLimits(keyCtx.keyId);

    const display = await this.assistantsService.getLivePublicDisplay(
      keyCtx.organizationId,
      assistantId,
    );
    if (!display) {
      throw new NotFoundException('Assistant not found');
    }

    void this.publishableKeysService.markUsed(keyCtx.keyId);

    return display;
  }
}
