import type { Assistant, AssistantDraft } from '@genie/types';

export const MOCK_ASSISTANTS: Assistant[] = [
  {
    id: 'asst-1',
    name: 'Support Assistant',
    description: 'Helps customers with product questions and support requests',
    purpose: 'customer_support',
    status: 'live',
    welcomeMessage: 'Hi! How can I help you today?',
    tone: 'friendly',
    instructions: 'You are a helpful customer support assistant. Answer questions based on the knowledge base.',
    knowledgeSourceCount: 3,
    conversationCount: 142,
    lastActivityAt: '2026-07-09T10:30:00Z',
    updatedAt: '2026-07-08T14:20:00Z',
    createdAt: '2026-06-15T09:00:00Z',
    deployed: true,
    appearance: {
      primaryColor: '#6366F1',
      position: 'bottom-right',
      showWelcomeBubble: true,
    },
  },
  {
    id: 'asst-2',
    name: 'Sales Assistant',
    description: 'Qualifies leads and answers pricing questions',
    purpose: 'sales',
    status: 'draft',
    welcomeMessage: 'Welcome! Interested in learning more about our product?',
    tone: 'professional',
    instructions: 'You are a sales assistant. Help visitors understand our product and pricing.',
    knowledgeSourceCount: 1,
    conversationCount: 0,
    lastActivityAt: '2026-07-07T16:00:00Z',
    updatedAt: '2026-07-07T16:00:00Z',
    createdAt: '2026-07-07T12:00:00Z',
    deployed: false,
    appearance: {
      primaryColor: '#6366F1',
      position: 'bottom-right',
      showWelcomeBubble: true,
    },
  },
];

export const DEFAULT_DRAFT: AssistantDraft = {
  name: '',
  purpose: 'customer_support',
  description: '',
  welcomeMessage: 'Hi! How can I help you today?',
  tone: 'friendly',
  instructions: '',
  knowledgeSources: [],
  appearance: {
    primaryColor: '#6366F1',
    position: 'bottom-right',
    showWelcomeBubble: true,
  },
};

export const PURPOSE_OPTIONS = [
  {
    id: 'customer_support' as const,
    title: 'Customer Support',
    description: 'Answer customer questions and resolve issues',
  },
  {
    id: 'sales' as const,
    title: 'Sales Assistant',
    description: 'Qualify leads and answer product questions',
  },
  {
    id: 'product_expert' as const,
    title: 'Product Expert',
    description: 'Help users understand features and capabilities',
  },
  {
    id: 'documentation' as const,
    title: 'Documentation Assistant',
    description: 'Guide users through docs and tutorials',
  },
  {
    id: 'lead_generation' as const,
    title: 'Lead Generation',
    description: 'Capture leads and schedule demos',
  },
  {
    id: 'custom' as const,
    title: 'Custom Assistant',
    description: 'Start from scratch with your own purpose',
  },
];

export const TONE_OPTIONS = [
  { id: 'friendly' as const, label: 'Friendly' },
  { id: 'professional' as const, label: 'Professional' },
  { id: 'helpful' as const, label: 'Helpful' },
  { id: 'concise' as const, label: 'Concise' },
  { id: 'custom' as const, label: 'Custom' },
];

let assistantsStore = [...MOCK_ASSISTANTS];

export function getAssistants(): Assistant[] {
  return assistantsStore;
}

export function getAssistantById(id: string): Assistant | undefined {
  return assistantsStore.find((a) => a.id === id);
}

export function addAssistant(assistant: Assistant): void {
  assistantsStore = [assistant, ...assistantsStore];
}

export function updateAssistant(id: string, updates: Partial<Assistant>): void {
  assistantsStore = assistantsStore.map((a) => (a.id === id ? { ...a, ...updates } : a));
}

export function hasAssistants(): boolean {
  return assistantsStore.length > 0;
}
