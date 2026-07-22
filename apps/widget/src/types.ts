/**
 * Public embed config for GenieWidget.init().
 * Auth semantics for apiKey (e.g. pk_live_*) are deferred — this task only validates presence/shape.
 */
export type GenieWidgetTheme = 'light' | 'dark' | 'auto';

export interface GenieWidgetConfig {
  apiKey: string;
  assistantId: string;
  /** Visual theme. `auto` follows prefers-color-scheme (default). */
  theme?: GenieWidgetTheme;
  /** Panel header title. */
  title?: string;
}

export interface GenieWidgetApi {
  init: (config: GenieWidgetConfig) => void;
  destroy: () => void;
  open: () => void;
  close: () => void;
  version: string;
}
