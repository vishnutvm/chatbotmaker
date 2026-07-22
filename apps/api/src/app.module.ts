import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { AiModule } from './modules/ai/ai.module';
import { AssistantsModule } from './modules/assistants/assistants.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { PublishableKeysModule } from './modules/publishable-keys/publishable-keys.module';
import { UsersModule } from './modules/users/users.module';
import { WidgetModule } from './modules/widget/widget.module';
import { AiInfrastructureModule } from './infrastructure/ai/ai-infrastructure.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    CacheModule,
    AiInfrastructureModule,
    HealthModule,
    UsersModule,
    OrganizationsModule,
    AuthModule,
    AiModule,
    AssistantsModule,
    PublishableKeysModule,
    WidgetModule,
  ],
})
export class AppModule {}
