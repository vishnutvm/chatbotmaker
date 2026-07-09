export type KnowledgeSourceType = 'website' | 'file' | 'sitemap' | 'text';
export type KnowledgeSourceStatus = 'ready' | 'processing' | 'needs_attention' | 'failed';

export interface KnowledgeSource {
  id: string;
  assistantId: string;
  name: string;
  type: KnowledgeSourceType;
  status: KnowledgeSourceStatus;
  pageCount: number;
  documentCount: number;
  lastUpdatedAt: string;
  url?: string;
}

export interface CrawlPage {
  id: string;
  url: string;
  title: string;
  selected: boolean;
}

export interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
}
