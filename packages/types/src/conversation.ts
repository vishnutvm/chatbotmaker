export type ConversationStatus = 'open' | 'resolved' | 'assigned' | 'unresolved';

export interface Conversation {
  id: string;
  assistantId: string;
  assistantName: string;
  visitorName: string;
  visitorEmail?: string;
  lastMessage: string;
  status: ConversationStatus;
  messageCount: number;
  updatedAt: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  createdAt: string;
}
