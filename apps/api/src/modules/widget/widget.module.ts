import { Module } from '@nestjs/common';
import { AssistantsModule } from '../assistants/assistants.module';
import { PublishableKeysModule } from '../publishable-keys/publishable-keys.module';
import { PublishableKeyGuard } from './guards/publishable-key.guard';
import { WidgetBootstrapService } from './widget-bootstrap.service';
import { WidgetChatService } from './widget-chat.service';
import { WidgetPublicController } from './widget-public.controller';

@Module({
  imports: [PublishableKeysModule, AssistantsModule],
  controllers: [WidgetPublicController],
  providers: [WidgetBootstrapService, WidgetChatService, PublishableKeyGuard],
})
export class WidgetModule {}
