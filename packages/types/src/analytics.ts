export interface DashboardMetrics {
  totalAssistants: number;
  conversations: number;
  messages: number;
  knowledgeSources: number;
  assistantsChange: number;
  conversationsChange: number;
  messagesChange: number;
  knowledgeChange: number;
}

export interface ConversationTrendPoint {
  date: string;
  count: number;
}

export interface DashboardInsight {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}

export interface AnalyticsSummary {
  conversations: number;
  messages: number;
  uniqueUsers: number;
  resolutionRate: number;
  aiUsage: number;
  trends: ConversationTrendPoint[];
  topTopics: { topic: string; count: number }[];
  unansweredQuestions: { question: string; count: number }[];
  knowledgeGaps: { topic: string; severity: 'low' | 'medium' | 'high' }[];
}
