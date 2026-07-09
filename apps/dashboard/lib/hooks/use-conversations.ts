'use client';

import { useQuery } from '@tanstack/react-query';
import type { Conversation } from '@genie/types';
import { MOCK_CONVERSATIONS } from '@/lib/mocks/conversations.mock';

export function useConversations(assistantId?: string) {
  return useQuery<Conversation[]>({
    queryKey: ['conversations', assistantId ?? 'all'],
    queryFn: async () =>
      assistantId
        ? MOCK_CONVERSATIONS.filter((c) => c.assistantId === assistantId)
        : MOCK_CONVERSATIONS,
  });
}
