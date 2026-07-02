import { Module } from '@nestjs/common';
import { CacheModule } from './infrastructure/cache/cache.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [CacheModule, HealthModule],
})
export class AppModule {}
