import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { RagModule } from '../rag/rag.module';
import { AssistantsController } from './assistants.controller';
import { AssistantsRepository } from './assistants.repository';
import { AssistantsService } from './assistants.service';

@Module({
  imports: [OrganizationsModule, AiModule, RagModule],
  controllers: [AssistantsController],
  providers: [AssistantsRepository, AssistantsService],
  exports: [AssistantsService],
})
export class AssistantsModule {}
