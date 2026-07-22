import { Module } from '@nestjs/common';
import { OrganizationsModule } from '../organizations/organizations.module';
import { PublishableKeyHasher } from './publishable-key.hasher';
import { PublishableKeyRateLimiter } from './publishable-key-rate-limiter';
import { PublishableKeysController } from './publishable-keys.controller';
import { PublishableKeysRepository } from './publishable-keys.repository';
import { PublishableKeysService } from './publishable-keys.service';

@Module({
  imports: [OrganizationsModule],
  controllers: [PublishableKeysController],
  providers: [
    PublishableKeysRepository,
    PublishableKeysService,
    PublishableKeyHasher,
    PublishableKeyRateLimiter,
  ],
  exports: [PublishableKeysService, PublishableKeyHasher, PublishableKeyRateLimiter],
})
export class PublishableKeysModule {}
