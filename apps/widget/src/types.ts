/**
 * Public embed config for GenieWidget.init().
 * Auth semantics for apiKey (e.g. pk_live_*) are deferred — this task only validates presence/shape.
 */
export interface GenieWidgetConfig {
  apiKey: string;
  assistantId: string;
}

export interface GenieWidgetApi {
  init: (config: GenieWidgetConfig) => void;
  version: string;
}
