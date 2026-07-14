export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatCompletionMessage {
  role: ChatRole;
  content: string;
}

export interface ChatCompletionRequest {
  systemPrompt?: string;
  messages: ChatCompletionMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface ChatCompletionUsage {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
}

export interface ChatCompletionResponse {
  id: string;
  organizationId: string;
  model: string;
  content: string;
  finishReason: string | null;
  usage: ChatCompletionUsage;
}

export type ChatStreamMetaEvent = {
  organizationId: string;
  model: string;
};

export type ChatStreamDeltaEvent = {
  content: string;
};

export type ChatStreamDoneEvent = {
  finishReason: string | null;
  usage: ChatCompletionUsage;
};

export type ChatStreamErrorEvent = {
  statusCode: number;
  code: string;
  message: string;
};
