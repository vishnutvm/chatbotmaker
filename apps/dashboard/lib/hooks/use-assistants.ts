'use client';

import { useQuery } from '@tanstack/react-query';
import type { Assistant } from '@genie/types';
import { getAssistants, getAssistantById } from '@/lib/mocks/assistants.mock';

export function useAssistants() {
  return useQuery<Assistant[]>({
    queryKey: ['assistants'],
    queryFn: async () => getAssistants(),
  });
}

export function useAssistant(id: string) {
  return useQuery<Assistant | undefined>({
    queryKey: ['assistants', id],
    queryFn: async () => getAssistantById(id),
    enabled: Boolean(id),
  });
}
