export const ASSISTANT_PURPOSES = [
  'customer_support',
  'sales',
  'product_expert',
  'documentation',
  'lead_generation',
  'custom',
] as const;
export type AssistantPurposeValue = (typeof ASSISTANT_PURPOSES)[number];

export const ASSISTANT_TONES = [
  'friendly',
  'professional',
  'helpful',
  'concise',
  'custom',
] as const;
export type AssistantToneValue = (typeof ASSISTANT_TONES)[number];

export const ASSISTANT_STATUSES = ['draft', 'live', 'paused'] as const;
export type AssistantStatusValue = (typeof ASSISTANT_STATUSES)[number];

export interface AssistantPreset {
  welcomeMessage: string;
  tone: AssistantToneValue;
  instructions: string;
}

/** Defaults applied on create when the field is omitted — keyed by purpose. */
export const ASSISTANT_PURPOSE_PRESETS: Record<AssistantPurposeValue, AssistantPreset> = {
  customer_support: {
    welcomeMessage: "Hi! How can I help you today?",
    tone: 'friendly',
    instructions:
      'You are a helpful customer support assistant. Answer questions about our products and ' +
      "services accurately and politely using the knowledge provided. If you don't know the " +
      'answer, say so honestly and offer to connect the user with a human agent.',
  },
  sales: {
    welcomeMessage: "Hi there! Looking for the right plan? I'm happy to help.",
    tone: 'professional',
    instructions:
      'You are a sales assistant. Help visitors understand our products, answer pricing and ' +
      'feature questions, and guide qualified leads toward a demo or purchase. Be persuasive, ' +
      'accurate, and never make up pricing or features that are not in the knowledge provided.',
  },
  product_expert: {
    welcomeMessage: 'Ask me anything about our product — I can help.',
    tone: 'helpful',
    instructions:
      'You are a product expert. Provide detailed, accurate answers about product features, ' +
      'use cases, and best practices based strictly on the knowledge provided.',
  },
  documentation: {
    welcomeMessage: 'Need help with the docs? Ask away.',
    tone: 'concise',
    instructions:
      'You are a documentation assistant. Answer developer questions clearly and concisely, ' +
      'referencing the provided documentation. Include code examples when helpful and correct.',
  },
  lead_generation: {
    welcomeMessage: "Hi! Tell me a bit about what you're looking for.",
    tone: 'friendly',
    instructions:
      'You are a lead generation assistant. Engage visitors warmly, understand their needs, ' +
      'and collect their name, email, and use case so the sales team can follow up.',
  },
  custom: {
    welcomeMessage: 'Hi! How can I help you today?',
    tone: 'friendly',
    instructions:
      'You are a helpful assistant. Answer questions accurately based on the knowledge provided.',
  },
};
