import type { GenieWidgetConfig, GenieWidgetTheme } from './types';

const THEMES = new Set<GenieWidgetTheme>(['light', 'dark', 'auto']);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates GenieWidget.init config. Throws with a clear, prefixed message.
 */
export function validateConfig(config: unknown): Required<
  Pick<GenieWidgetConfig, 'apiKey' | 'assistantId'>
> &
  Pick<GenieWidgetConfig, 'theme' | 'title'> {
  if (config === null || config === undefined || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('GenieWidget: config object is required ({ apiKey, assistantId })');
  }

  const { apiKey, assistantId, theme, title } = config as Record<string, unknown>;

  if (!isNonEmptyString(apiKey)) {
    throw new Error('GenieWidget: apiKey is required (non-empty string)');
  }

  if (!isNonEmptyString(assistantId)) {
    throw new Error('GenieWidget: assistantId is required (non-empty string)');
  }

  if (theme !== undefined) {
    if (typeof theme !== 'string' || !THEMES.has(theme as GenieWidgetTheme)) {
      throw new Error('GenieWidget: theme must be "light", "dark", or "auto"');
    }
  }

  if (title !== undefined && typeof title !== 'string') {
    throw new Error('GenieWidget: title must be a string when provided');
  }

  const trimmedTitle = typeof title === 'string' ? title.trim() : undefined;

  return {
    apiKey: apiKey.trim(),
    assistantId: assistantId.trim(),
    theme: (theme as GenieWidgetTheme | undefined) ?? 'auto',
    title: trimmedTitle && trimmedTitle.length > 0 ? trimmedTitle : 'Chat',
  };
}
