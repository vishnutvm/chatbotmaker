import type { GenieWidgetConfig } from './types';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates GenieWidget.init config. Throws with a clear, prefixed message.
 */
export function validateConfig(config: unknown): GenieWidgetConfig {
  if (config === null || config === undefined || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('GenieWidget: config object is required ({ apiKey, assistantId })');
  }

  const { apiKey, assistantId } = config as Record<string, unknown>;

  if (!isNonEmptyString(apiKey)) {
    throw new Error('GenieWidget: apiKey is required (non-empty string)');
  }

  if (!isNonEmptyString(assistantId)) {
    throw new Error('GenieWidget: assistantId is required (non-empty string)');
  }

  return {
    apiKey: apiKey.trim(),
    assistantId: assistantId.trim(),
  };
}
