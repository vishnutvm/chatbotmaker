import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/jwt-payload';
import { SupabaseJwtGuard } from '../auth/guards/supabase-jwt.guard';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organizations.dto';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
@UseGuards(SupabaseJwtGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.organizationsService.listForUser(user.userId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(user.userId, dto);
  }

  @Get(':organizationId')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.organizationsService.getForUser(user.userId, organizationId);
  }

  @Patch(':organizationId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.updateForUser(user.userId, organizationId, dto);
  }
}
