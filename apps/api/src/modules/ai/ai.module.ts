import { Module } from '@nestjs/common';
import { AiInfrastructureModule } from '../../infrastructure/ai/ai-infrastructure.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { AiController } from './ai.controller';
import { AiRateLimiter } from './ai-rate-limiter';
import { AiService } from './ai.service';
import { AiUsageRepository } from './ai-usage.repository';
import { ModelRouter } from './model-router';
import { PromptAssembler } from './prompt.assembler';

@Module({
  imports: [OrganizationsModule, AiInfrastructureModule],
  controllers: [AiController],
  providers: [AiService, ModelRouter, PromptAssembler, AiUsageRepository, AiRateLimiter],
  exports: [AiService],
})
export class AiModule {}
