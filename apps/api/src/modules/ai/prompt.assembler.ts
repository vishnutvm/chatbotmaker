import { BadRequestException, Injectable } from '@nestjs/common';
import type { ChatMessage } from '../../infrastructure/ai/ai.interface';
import type { ChatCompletionDto } from './dto/chat-completion.dto';

const SOFT_ASSEMBLED_CHAR_LIMIT = 100_000;

@Injectable()
export class PromptAssembler {
  /**
   * Builds provider chat messages: optional leading systemPrompt + request messages.
   * No RAG / assistant / history injection in U1.
   */
  assemble(dto: ChatCompletionDto): ChatMessage[] {
    const messages: ChatMessage[] = [];

    if (dto.systemPrompt !== undefined) {
      const systemPrompt = dto.systemPrompt.trim();
      if (!systemPrompt) {
        throw new BadRequestException('systemPrompt must not be empty');
      }
      messages.push({ role: 'system', content: systemPrompt });
    }

    for (const message of dto.messages) {
      const role = message.role.trim() as ChatMessage['role'];
      const content = message.content.trim();
      if (!content) {
        throw new BadRequestException('message content must not be empty');
      }
      if (role !== 'user' && role !== 'assistant' && role !== 'system') {
        throw new BadRequestException('message role is invalid');
      }
      messages.push({ role, content });
    }

    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    if (totalChars > SOFT_ASSEMBLED_CHAR_LIMIT) {
      throw new BadRequestException(
        `Assembled prompt exceeds ${SOFT_ASSEMBLED_CHAR_LIMIT} character soft limit`,
      );
    }

    return messages;
  }
}
