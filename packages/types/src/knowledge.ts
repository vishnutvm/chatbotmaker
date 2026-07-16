export type KnowledgeSourceType = 'website' | 'file' | 'sitemap' | 'text' | 'url';
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

/** API DTO for `apps/api` assistants module — MVP supports text/url sources only. */
export type ApiKnowledgeSourceType = 'text' | 'url';
export type ApiKnowledgeSourceStatus = 'pending' | 'ready' | 'failed';

export interface KnowledgeSourceDto {
  id: string;
  assistantId: string;
  name: string;
  type: KnowledgeSourceType;
  status: ApiKnowledgeSourceStatus;
  url?: string;
  contentPreview?: string;
  pageCount: number;
  documentCount: number;
  lastUpdatedAt: string;
}

export interface KnowledgeSourcesResponse {
  sources: KnowledgeSourceDto[];
}

export interface CreateTextKnowledgeSourceRequest {
  type: 'text';
  name: string;
  content: string;
}

export interface CreateUrlKnowledgeSourceRequest {
  type: 'url';
  name: string;
  url: string;
}

export type CreateKnowledgeSourceRequest =
  | CreateTextKnowledgeSourceRequest
  | CreateUrlKnowledgeSourceRequest;

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
