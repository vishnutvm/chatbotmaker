import { Global, Module } from '@nestjs/common';
import { PAYMENT_PROVIDER } from './payment-provider.interface';
import { StripePaymentProvider } from './stripe.provider';

@Global()
@Module({
  providers: [
    StripePaymentProvider,
    {
      provide: PAYMENT_PROVIDER,
      useExisting: StripePaymentProvider,
    },
  ],
  exports: [PAYMENT_PROVIDER, StripePaymentProvider],
})
export class BillingInfrastructureModule {}
