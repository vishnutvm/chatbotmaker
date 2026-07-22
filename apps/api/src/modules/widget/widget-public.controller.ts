import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentPublishableKey } from './decorators/current-publishable-key.decorator';
import {
  PublishableKeyGuard,
  type PublishableKeyRequestContext,
} from './guards/publishable-key.guard';
import { WidgetBootstrapService } from './widget-bootstrap.service';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Controller('public/widget')
@UseGuards(PublishableKeyGuard)
export class WidgetPublicController {
  constructor(private readonly widgetBootstrapService: WidgetBootstrapService) {}

  @Get('bootstrap')
  bootstrap(
    @CurrentPublishableKey() key: PublishableKeyRequestContext,
    @Query('assistantId') assistantId: string,
  ) {
    if (!assistantId || typeof assistantId !== 'string') {
      throw new BadRequestException('assistantId query parameter is required');
    }
    if (!UUID_RE.test(assistantId)) {
      throw new BadRequestException('assistantId must be a valid UUID');
    }
    return this.widgetBootstrapService.bootstrap(key, assistantId);
  }
}
