import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChatCompletionMessageDto {
  @IsIn(['user', 'assistant', 'system'])
  role!: 'user' | 'assistant' | 'system';

  @IsString()
  @MinLength(1)
  @MaxLength(32_000)
  content!: string;
}

/**
 * Chat completion body. Unknown fields (including `model`, `stream`) are rejected
 * by the global ValidationPipe (`forbidNonWhitelisted`).
 */
export class ChatCompletionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(8_000)
  systemPrompt?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ChatCompletionMessageDto)
  messages!: ChatCompletionMessageDto[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2048)
  @Type(() => Number)
  maxTokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  @Type(() => Number)
  temperature?: number;
}
