import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { pipeAiSse } from '../ai/pipe-ai-sse';
import { CurrentPublishableKey } from './decorators/current-publishable-key.decorator';
import { WidgetChatStreamDto } from './dto/widget-chat-stream.dto';
import {
  PublishableKeyGuard,
  type PublishableKeyRequestContext,
} from './guards/publishable-key.guard';
import { WidgetBootstrapService } from './widget-bootstrap.service';
import { WidgetChatService } from './widget-chat.service';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Controller('public/widget')
@UseGuards(PublishableKeyGuard)
export class WidgetPublicController {
  constructor(
    private readonly widgetBootstrapService: WidgetBootstrapService,
    private readonly widgetChatService: WidgetChatService,
  ) {}

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

  @Post('chat/stream')
  @HttpCode(200)
  async chatStream(
    @CurrentPublishableKey() key: PublishableKeyRequestContext,
    @Body() dto: WidgetChatStreamDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    // Live-assistant / rate-limit / AI config throw before first yield → normal HTTP JSON.
    const clientIp = resolveClientIp(req);
    await pipeAiSse(res, req, (signal) =>
      this.widgetChatService.streamChat(key, dto, signal, clientIp),
    );
  }
}

/** Nest/Express `req.ip` (honors trust proxy); falls back to socket remote address. */
function resolveClientIp(req: Request): string {
  const ip = typeof req.ip === 'string' && req.ip.trim() ? req.ip.trim() : '';
  if (ip) {
    return ip;
  }
  const remote = req.socket?.remoteAddress;
  return typeof remote === 'string' && remote.trim() ? remote.trim() : 'unknown';
}
