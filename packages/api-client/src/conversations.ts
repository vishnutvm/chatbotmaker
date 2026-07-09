import type { Conversation, Message } from '@genie/types';

/** Stub — wire to /api/v1/conversations when Phase 4+ completes */
export interface ConversationsClient {
  list(token: string, assistantId?: string): Promise<Conversation[]>;
  get(token: string, id: string): Promise<Conversation>;
  listMessages(token: string, conversationId: string): Promise<Message[]>;
}

export function createConversationsClient(_baseUrl: string): ConversationsClient {
  return {
    async list() {
      throw new Error('Conversations API not implemented — use mock hooks');
    },
    async get() {
      throw new Error('Conversations API not implemented — use mock hooks');
    },
    async listMessages() {
      throw new Error('Conversations API not implemented — use mock hooks');
    },
  };
}
