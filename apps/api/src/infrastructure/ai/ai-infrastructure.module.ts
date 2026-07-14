import { Global, Module } from '@nestjs/common';
import { AI_PROVIDER } from './ai.interface';
import { OpenAiProvider } from './openai.provider';

@Global()
@Module({
  providers: [
    OpenAiProvider,
    {
      provide: AI_PROVIDER,
      useExisting: OpenAiProvider,
    },
  ],
  exports: [AI_PROVIDER, OpenAiProvider],
})
export class AiInfrastructureModule {}
