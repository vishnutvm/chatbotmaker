'use client';

import { useQuery } from '@tanstack/react-query';
import type { KnowledgeSource } from '@genie/types';
import { MOCK_KNOWLEDGE_SOURCES } from '@/lib/mocks/knowledge.mock';

export function useKnowledgeSources(assistantId: string) {
  return useQuery<KnowledgeSource[]>({
    queryKey: ['knowledge', assistantId],
    queryFn: async () => MOCK_KNOWLEDGE_SOURCES.filter((k) => k.assistantId === assistantId),
    enabled: Boolean(assistantId),
  });
}
