import type { KnowledgeSourceDto } from './knowledge';

export type AssistantStatus = 'live' | 'draft' | 'paused' | 'processing';
export type AssistantPurpose =
  | 'customer_support'
  | 'sales'
  | 'product_expert'
  | 'documentation'
  | 'lead_generation'
  | 'custom';

export type AssistantTone = 'friendly' | 'professional' | 'helpful' | 'concise' | 'custom';

export interface Assistant {
  id: string;
  /** Present on API responses (`apps/api/src/modules/assistants`); absent from legacy mock data. */
  organizationId?: string;
  name: string;
  description: string;
  purpose: AssistantPurpose;
  status: AssistantStatus;
  welcomeMessage: string;
  tone: AssistantTone;
  instructions: string;
  knowledgeSourceCount: number;
  conversationCount: number;
  lastActivityAt?: string;
  updatedAt: string;
  createdAt: string;
  deployed: boolean;
  deployedAt?: string;
  appearance: AssistantAppearance;
  knowledgeSources?: KnowledgeSourceDto[];
}

export interface AssistantAppearance {
  primaryColor: string;
  position: 'bottom-right' | 'bottom-left';
  avatarUrl?: string;
  showWelcomeBubble: boolean;
}

export interface AssistantDraft {
  name: string;
  purpose: AssistantPurpose;
  description: string;
  welcomeMessage: string;
  tone: AssistantTone;
  instructions: string;
  knowledgeSources: KnowledgeSourceDraft[];
  appearance: AssistantAppearance;
}

export interface KnowledgeSourceDraft {
  id: string;
  type: 'website' | 'file' | 'sitemap' | 'text';
  name: string;
  status: 'ready' | 'processing' | 'failed' | 'needs_attention';
  pageCount?: number;
}

/** `AssistantDto` per docs/api/assistants.md — same shape as `Assistant` returned by the API. */
export type AssistantDto = Assistant;

export interface AssistantsListResponse {
  assistants: AssistantDto[];
}

export interface CreateAssistantRequest {
  name: string;
  purpose: AssistantPurpose;
  description?: string;
  welcomeMessage?: string;
  tone?: AssistantTone;
  instructions?: string;
}

export interface UpdateAssistantRequest {
  name?: string;
  description?: string;
  purpose?: AssistantPurpose;
  welcomeMessage?: string;
  tone?: AssistantTone;
  instructions?: string;
  status?: AssistantStatus;
  appearance?: Partial<AssistantAppearance>;
}

export interface AssistantChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatWithAssistantRequest {
  messages: AssistantChatMessage[];
}

export interface ChatWithAssistantResponse {
  id: string;
  assistantId: string;
  organizationId: string;
  model: string;
  content: string;
  finishReason: string | null;
  usage: {
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
  };
}
