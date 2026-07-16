import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  ASSISTANT_PURPOSES,
  ASSISTANT_STATUSES,
  ASSISTANT_TONES,
  type AssistantPurposeValue,
  type AssistantStatusValue,
  type AssistantToneValue,
} from '../assistant-presets';

const POSITIONS = ['bottom-right', 'bottom-left'] as const;

export class AssistantAppearanceDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  primaryColor?: string;

  @IsOptional()
  @IsIn(POSITIONS)
  position?: (typeof POSITIONS)[number];

  @IsOptional()
  @IsBoolean()
  showWelcomeBubble?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  avatarUrl?: string;
}

export class CreateAssistantDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsIn(ASSISTANT_PURPOSES)
  purpose!: AssistantPurposeValue;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  welcomeMessage?: string;

  @IsOptional()
  @IsIn(ASSISTANT_TONES)
  tone?: AssistantToneValue;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  instructions?: string;
}

export class UpdateAssistantDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsIn(ASSISTANT_PURPOSES)
  purpose?: AssistantPurposeValue;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  welcomeMessage?: string;

  @IsOptional()
  @IsIn(ASSISTANT_TONES)
  tone?: AssistantToneValue;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  instructions?: string;

  @IsOptional()
  @IsIn(ASSISTANT_STATUSES)
  status?: AssistantStatusValue;

  @IsOptional()
  @ValidateNested()
  @Type(() => AssistantAppearanceDto)
  appearance?: AssistantAppearanceDto;
}

/**
 * Single DTO covers both `text` and `url` knowledge source variants — `content`/`url`
 * requirement per-type is enforced in the service (keeps the request shape simple and
 * still rejects unknown fields via the global `forbidNonWhitelisted` pipe).
 */
export class CreateKnowledgeSourceDto {
  @IsIn(['text', 'url'])
  type!: 'text' | 'url';

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100_000)
  content?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2000)
  url?: string;
}

export class AssistantChatMessageDto {
  @IsIn(['user', 'assistant', 'system'])
  role!: 'user' | 'assistant' | 'system';

  @IsString()
  @MinLength(1)
  @MaxLength(32_000)
  content!: string;
}

export class ChatWithAssistantDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => AssistantChatMessageDto)
  messages!: AssistantChatMessageDto[];
}
