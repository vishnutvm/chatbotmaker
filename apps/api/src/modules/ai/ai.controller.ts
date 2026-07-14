import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/jwt-payload';
import { SupabaseJwtGuard } from '../auth/guards/supabase-jwt.guard';
import { AiService } from './ai.service';
import { ChatCompletionDto } from './dto/chat-completion.dto';

@Controller('organizations/:organizationId/ai/chat')
@UseGuards(SupabaseJwtGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('completions')
  @HttpCode(200)
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: ChatCompletionDto,
  ) {
    return this.aiService.complete(user.userId, organizationId, dto);
  }

  @Post('completions/stream')
  async stream(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: ChatCompletionDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const abortController = new AbortController();
    const onClose = () => abortController.abort();
    req.on('close', onClose);

    try {
      // Membership / validation / rate-limit throw before first yield → normal HTTP JSON errors.
      const generator = this.aiService.stream(
        user.userId,
        organizationId,
        dto,
        abortController.signal,
      );

      const first = await generator.next();
      if (first.done) {
        res.status(500).json({
          statusCode: 500,
          message: 'Empty AI stream',
          error: 'Internal Server Error',
        });
        return;
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();

      this.writeSse(res, first.value.event, first.value.data);

      for await (const event of generator) {
        if (abortController.signal.aborted || res.writableEnded) {
          break;
        }
        this.writeSse(res, event.event, event.data);
      }
    } catch (error) {
      if (!res.headersSent) {
        this.writeHttpError(res, error);
        return;
      }
      if (!res.writableEnded) {
        const mapped = this.mapSseError(error);
        this.writeSse(res, 'error', mapped);
      }
    } finally {
      req.off('close', onClose);
      if (!res.writableEnded) {
        res.end();
      }
    }
  }

  private writeSse(res: Response, event: string, data: unknown): void {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  private writeHttpError(res: Response, error: unknown): void {
    if (error instanceof HttpException) {
      const status = error.getStatus();
      const body = error.getResponse();
      res.status(status).json(
        typeof body === 'string'
          ? { statusCode: status, message: body, error: error.name }
          : body,
      );
      return;
    }

    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
  }

  private mapSseError(error: unknown): {
    statusCode: number;
    code: string;
    message: string;
  } {
    if (error instanceof HttpException) {
      const status = error.getStatus();
      const body = error.getResponse();
      const code =
        typeof body === 'object' && body !== null && 'code' in body
          ? String((body as { code: unknown }).code)
          : status === 503
            ? 'AI_NOT_CONFIGURED'
            : 'AI_PROVIDER_ERROR';
      const message =
        typeof body === 'object' && body !== null && 'message' in body
          ? String((body as { message: unknown }).message)
          : typeof body === 'string'
            ? body
            : 'Upstream model request failed';
      return { statusCode: status, code, message };
    }

    return {
      statusCode: 502,
      code: 'AI_PROVIDER_ERROR',
      message: 'Upstream model request failed',
    };
  }
}
