import type { Conversation, Message } from '@genie/types';

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    assistantId: 'asst-1',
    assistantName: 'Support Assistant',
    visitorName: 'John Smith',
    visitorEmail: 'john@example.com',
    lastMessage: 'Thanks, that answered my question!',
    status: 'resolved',
    messageCount: 6,
    updatedAt: '2026-07-09T10:30:00Z',
    createdAt: '2026-07-09T10:15:00Z',
  },
  {
    id: 'conv-2',
    assistantId: 'asst-1',
    assistantName: 'Support Assistant',
    visitorName: 'Sarah Chen',
    visitorEmail: 'sarah@company.io',
    lastMessage: 'What are your pricing plans?',
    status: 'open',
    messageCount: 3,
    updatedAt: '2026-07-09T09:45:00Z',
    createdAt: '2026-07-09T09:40:00Z',
  },
  {
    id: 'conv-3',
    assistantId: 'asst-1',
    assistantName: 'Support Assistant',
    visitorName: 'Mike Johnson',
    lastMessage: 'I need help with my account settings',
    status: 'unresolved',
    messageCount: 4,
    updatedAt: '2026-07-08T16:20:00Z',
    createdAt: '2026-07-08T16:10:00Z',
  },
];

export const MOCK_MESSAGES: Record<string, Message[]> = {
  'conv-1': [
    {
      id: 'm1',
      conversationId: 'conv-1',
      role: 'user',
      content: 'How do I reset my password?',
      createdAt: '2026-07-09T10:15:00Z',
    },
    {
      id: 'm2',
      conversationId: 'conv-1',
      role: 'assistant',
      content:
        'To reset your password, go to Settings > Security > Reset Password. You will receive an email with a reset link.',
      sources: ['https://example.com/docs/password-reset'],
      createdAt: '2026-07-09T10:15:30Z',
    },
    {
      id: 'm3',
      conversationId: 'conv-1',
      role: 'user',
      content: 'Thanks, that answered my question!',
      createdAt: '2026-07-09T10:30:00Z',
    },
  ],
  'conv-2': [
    {
      id: 'm4',
      conversationId: 'conv-2',
      role: 'user',
      content: 'What are your pricing plans?',
      createdAt: '2026-07-09T09:40:00Z',
    },
    {
      id: 'm5',
      conversationId: 'conv-2',
      role: 'assistant',
      content:
        'We offer three plans: Starter at $29/mo, Pro at $79/mo, and Enterprise with custom pricing. Each includes AI assistants and knowledge bases.',
      sources: ['https://example.com/pricing'],
      createdAt: '2026-07-09T09:41:00Z',
    },
  ],
};

export const MOCK_CHAT_RESPONSES: Record<string, { content: string; sources: string[] }> = {
  default: {
    content:
      "Based on your knowledge base, I can help answer questions about your product, pricing, and support. Try asking something specific!",
    sources: ['https://example.com'],
  },
  pricing: {
    content:
      'We offer Starter ($29/mo), Pro ($79/mo), and Enterprise plans. All plans include AI assistants and knowledge bases.',
    sources: ['https://example.com/pricing'],
  },
  support: {
    content:
      'For support, you can reach us at support@example.com or use the help center at example.com/help.',
    sources: ['https://example.com/support'],
  },
};

export async function simulateChatResponse(
  message: string,
): Promise<{ content: string; sources: string[] }> {
  await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));
  const lower = message.toLowerCase();
  if (lower.includes('pric') || lower.includes('plan') || lower.includes('cost')) {
    return MOCK_CHAT_RESPONSES.pricing;
  }
  if (lower.includes('support') || lower.includes('help') || lower.includes('contact')) {
    return MOCK_CHAT_RESPONSES.support;
  }
  return MOCK_CHAT_RESPONSES.default;
}
