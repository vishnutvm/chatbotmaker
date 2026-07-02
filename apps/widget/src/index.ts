export interface GenieWidgetConfig {
  apiKey: string;
  assistantId?: string;
}

export function init(config: GenieWidgetConfig): void {
  if (!config.apiKey) {
    throw new Error('GenieWidget: apiKey is required');
  }
  // Sprint 1 placeholder — full embed UI in Phase 7
  console.info('[GenieWidget] initialized', { assistantId: config.assistantId ?? 'default' });
}

if (typeof window !== 'undefined') {
  (window as unknown as { GenieWidget: { init: typeof init } }).GenieWidget = { init };
}
