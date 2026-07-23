/**
 * Public embed config for GenieWidget.init().
 * apiKey must be a publishable key (pk_live_…).
 */
export type GenieWidgetTheme = 'light' | 'dark' | 'auto';

export interface GenieWidgetConfig {
  apiKey: string;
  assistantId: string;
  /** API origin for bootstrap (default: production Railway URL or same-origin relative). */
  apiBaseUrl?: string;
  /** Visual theme. `auto` follows prefers-color-scheme (default). */
  theme?: GenieWidgetTheme;
  /** Panel header title (overrides server name when set). */
  title?: string;
}

export interface WidgetBootstrapResult {
  assistantId: string;
  organizationId: string;
  name: string;
  welcomeMessage: string;
  appearance: Record<string, unknown>;
}

/** Chat turn sent to public widget stream (no system role). */
export interface WidgetChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Payload from SSE `done` event (AI U1 shape). */
export interface WidgetChatStreamDone {
  finishReason: string | null;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface GenieWidgetApi {
  init: (config: GenieWidgetConfig) => void;
  destroy: () => void;
  open: () => void;
  close: () => void;
  version: string;
}
