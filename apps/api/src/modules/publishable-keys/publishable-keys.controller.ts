import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/jwt-payload';
import { SupabaseJwtGuard } from '../auth/guards/supabase-jwt.guard';
import { CreatePublicKeyDto } from './dto/publishable-keys.dto';
import { PublishableKeysService } from './publishable-keys.service';

@Controller('organizations/:organizationId/public-keys')
@UseGuards(SupabaseJwtGuard)
export class PublishableKeysController {
  constructor(private readonly publishableKeysService: PublishableKeysService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: CreatePublicKeyDto,
  ) {
    return this.publishableKeysService.create(user.userId, organizationId, dto.name);
  }

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.publishableKeysService.list(user.userId, organizationId);
  }

  @Post(':keyId/revoke')
  @HttpCode(HttpStatus.OK)
  revoke(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('keyId', ParseUUIDPipe) keyId: string,
  ) {
    return this.publishableKeysService.revoke(user.userId, organizationId, keyId);
  }
}
