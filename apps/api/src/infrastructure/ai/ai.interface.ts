export type ChatMessageRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatMessageRole;
  content: string;
}

export interface ChatParams {
  model: string;
  messages: ChatMessage[];
  maxTokens: number;
  temperature?: number;
  /** AbortSignal for canceling in-flight provider requests (SSE disconnect). */
  signal?: AbortSignal;
}

export interface ChatUsage {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
}

export interface ChatResult {
  id: string;
  model: string;
  content: string;
  finishReason: string | null;
  usage: ChatUsage;
}

export type ChatStreamChunk =
  | { type: 'delta'; content: string }
  | { type: 'done'; finishReason: string | null; usage: ChatUsage; id?: string };

export interface AIProvider {
  chat(params: ChatParams): Promise<ChatResult>;
  stream(params: ChatParams): AsyncIterable<ChatStreamChunk>;
  embed(input: string | string[]): Promise<number[] | number[][]>;
}

export const AI_PROVIDER = Symbol('AI_PROVIDER');
