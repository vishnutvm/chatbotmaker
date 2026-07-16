import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { AssistantsController } from './assistants.controller';
import { AssistantsRepository } from './assistants.repository';
import { AssistantsService } from './assistants.service';

@Module({
  imports: [OrganizationsModule, AiModule],
  controllers: [AssistantsController],
  providers: [AssistantsRepository, AssistantsService],
  exports: [AssistantsService],
})
export class AssistantsModule {}
