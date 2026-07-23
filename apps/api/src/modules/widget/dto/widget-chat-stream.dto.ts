import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class WidgetChatMessageDto {
  /** Client may only send user/assistant turns — system prompt is server-owned. */
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}

/**
 * Public widget SSE chat body.
 * Unknown fields (system, model, organizationId, stream, …) are rejected by
 * the global ValidationPipe (`forbidNonWhitelisted`).
 */
export class WidgetChatStreamDto {
  @IsUUID()
  assistantId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => WidgetChatMessageDto)
  messages!: WidgetChatMessageDto[];
}
