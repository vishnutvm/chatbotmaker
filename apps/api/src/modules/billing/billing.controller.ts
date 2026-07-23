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
import { BillingService } from './billing.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

@Controller('organizations/:organizationId/billing')
@UseGuards(SupabaseJwtGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription')
  getSubscription(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.billingService.getSubscription(user.userId, organizationId);
  }

  @Post('checkout-session')
  @HttpCode(HttpStatus.CREATED)
  createCheckoutSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.billingService.createCheckoutSession(user.userId, organizationId, dto.plan);
  }

  @Post('portal-session')
  @HttpCode(HttpStatus.CREATED)
  createPortalSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.billingService.createPortalSession(user.userId, organizationId);
  }
}
