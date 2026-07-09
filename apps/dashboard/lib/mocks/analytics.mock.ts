import type { AnalyticsSummary, DashboardInsight, DashboardMetrics } from '@genie/types';

export const MOCK_METRICS: DashboardMetrics = {
  totalAssistants: 2,
  conversations: 142,
  messages: 1248,
  knowledgeSources: 4,
  assistantsChange: 0,
  conversationsChange: 12,
  messagesChange: 8,
  knowledgeChange: 25,
};

export const MOCK_INSIGHTS: DashboardInsight[] = [
  {
    id: 'insight-1',
    type: 'warning',
    title: '12 questions could not be answered',
    description: 'Add more knowledge to improve response quality.',
    actionLabel: 'Add Knowledge',
    actionHref: '/assistants/asst-1/knowledge',
  },
  {
    id: 'insight-2',
    type: 'info',
    title: 'Website knowledge last synced 14 days ago',
    description: 'Keep your assistant up to date with fresh content.',
    actionLabel: 'Sync Now',
    actionHref: '/assistants/asst-1/knowledge',
  },
  {
    id: 'insight-3',
    type: 'success',
    title: 'Sales Assistant is ready to deploy',
    description: 'Your assistant has been tested and is ready for your website.',
    actionLabel: 'Deploy',
    actionHref: '/assistants/asst-2/settings',
  },
];

export const MOCK_TRENDS = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(2026, 5, 10 + i).toISOString().split('T')[0],
  count: Math.floor(3 + Math.random() * 12),
}));

export const MOCK_ANALYTICS: AnalyticsSummary = {
  conversations: 142,
  messages: 1248,
  uniqueUsers: 89,
  resolutionRate: 78,
  aiUsage: 45200,
  trends: MOCK_TRENDS,
  topTopics: [
    { topic: 'Pricing', count: 34 },
    { topic: 'Account Setup', count: 28 },
    { topic: 'Integrations', count: 19 },
    { topic: 'Billing', count: 15 },
    { topic: 'API Usage', count: 12 },
  ],
  unansweredQuestions: [
    { question: 'Do you offer annual billing discounts?', count: 5 },
    { question: 'Can I use custom domains?', count: 3 },
    { question: 'Is there a free trial?', count: 4 },
  ],
  knowledgeGaps: [
    { topic: 'Enterprise pricing', severity: 'high' },
    { topic: 'SSO configuration', severity: 'medium' },
    { topic: 'Data retention policy', severity: 'low' },
  ],
};
