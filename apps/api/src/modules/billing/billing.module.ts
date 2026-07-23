import { Module } from '@nestjs/common';
import { BillingInfrastructureModule } from '../../infrastructure/billing/billing-infrastructure.module';
import { AuthModule } from '../auth/auth.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { BillingController } from './billing.controller';
import { BillingRateLimiter } from './billing-rate-limiter';
import { BillingRepository } from './billing.repository';
import { BillingService } from './billing.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeWebhookEventRepository } from './stripe-webhook-event.repository';

@Module({
  imports: [OrganizationsModule, BillingInfrastructureModule, AuthModule],
  controllers: [BillingController, StripeWebhookController],
  providers: [
    BillingService,
    BillingRepository,
    StripeWebhookEventRepository,
    BillingRateLimiter,
  ],
  exports: [BillingService],
})
export class BillingModule {}
