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
  name: string;
  description: string;
  purpose: AssistantPurpose;
  status: AssistantStatus;
  welcomeMessage: string;
  tone: AssistantTone;
  instructions: string;
  knowledgeSourceCount: number;
  conversationCount: number;
  lastActivityAt: string;
  updatedAt: string;
  createdAt: string;
  deployed: boolean;
  appearance: AssistantAppearance;
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
