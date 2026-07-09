'use client';

import { useQuery } from '@tanstack/react-query';
import type { AnalyticsSummary } from '@genie/types';
import { MOCK_ANALYTICS } from '@/lib/mocks/analytics.mock';

export function useAnalytics() {
  return useQuery<AnalyticsSummary>({
    queryKey: ['analytics'],
    queryFn: async () => MOCK_ANALYTICS,
  });
}
