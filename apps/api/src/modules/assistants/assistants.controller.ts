import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/jwt-payload';
import { SupabaseJwtGuard } from '../auth/guards/supabase-jwt.guard';
import { AssistantsService } from './assistants.service';
import {
  ChatWithAssistantDto,
  CreateAssistantDto,
  CreateKnowledgeSourceDto,
  UpdateAssistantDto,
} from './dto/assistants.dto';

@Controller('organizations/:organizationId/assistants')
@UseGuards(SupabaseJwtGuard)
export class AssistantsController {
  constructor(private readonly assistantsService: AssistantsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.assistantsService.list(user.userId, organizationId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateAssistantDto,
  ) {
    return this.assistantsService.create(user.userId, organizationId, dto);
  }

  @Get(':assistantId')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('assistantId', ParseUUIDPipe) assistantId: string,
  ) {
    return this.assistantsService.get(user.userId, organizationId, assistantId);
  }

  @Patch(':assistantId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('assistantId', ParseUUIDPipe) assistantId: string,
    @Body() dto: UpdateAssistantDto,
  ) {
    return this.assistantsService.update(user.userId, organizationId, assistantId, dto);
  }

  @Delete(':assistantId')
  @HttpCode(204)
  delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('assistantId', ParseUUIDPipe) assistantId: string,
  ) {
    return this.assistantsService.delete(user.userId, organizationId, assistantId);
  }

  @Post(':assistantId/deploy')
  @HttpCode(200)
  deploy(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('assistantId', ParseUUIDPipe) assistantId: string,
  ) {
    return this.assistantsService.deploy(user.userId, organizationId, assistantId);
  }

  @Post(':assistantId/chat')
  @HttpCode(200)
  chat(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('assistantId', ParseUUIDPipe) assistantId: string,
    @Body() dto: ChatWithAssistantDto,
  ) {
    return this.assistantsService.chat(user.userId, organizationId, assistantId, dto);
  }

  @Get(':assistantId/knowledge')
  listKnowledge(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('assistantId', ParseUUIDPipe) assistantId: string,
  ) {
    return this.assistantsService.listKnowledge(user.userId, organizationId, assistantId);
  }

  @Post(':assistantId/knowledge')
  @HttpCode(201)
  addKnowledge(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('assistantId', ParseUUIDPipe) assistantId: string,
    @Body() dto: CreateKnowledgeSourceDto,
  ) {
    return this.assistantsService.addKnowledge(user.userId, organizationId, assistantId, dto);
  }

  @Delete(':assistantId/knowledge/:sourceId')
  @HttpCode(204)
  removeKnowledge(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('assistantId', ParseUUIDPipe) assistantId: string,
    @Param('sourceId', ParseUUIDPipe) sourceId: string,
  ) {
    return this.assistantsService.removeKnowledge(user.userId, organizationId, assistantId, sourceId);
  }
}
