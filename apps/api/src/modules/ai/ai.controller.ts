import {
  Body,
  Controller,
  HttpCode,
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
import { memberActor } from './ai-actor';
import { AiService } from './ai.service';
import { ChatCompletionDto } from './dto/chat-completion.dto';
import { pipeAiSse } from './pipe-ai-sse';

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
    return this.aiService.complete(memberActor(user.userId, organizationId), dto);
  }

  @Post('completions/stream')
  @HttpCode(200)
  async stream(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: ChatCompletionDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    // Membership / validation / rate-limit throw before first yield → normal HTTP JSON.
    await pipeAiSse(res, req, (signal) =>
      this.aiService.stream(memberActor(user.userId, organizationId), dto, signal),
    );
  }
}
