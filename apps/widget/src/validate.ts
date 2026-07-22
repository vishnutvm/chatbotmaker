import type { GenieWidgetConfig, GenieWidgetTheme } from './types';

const THEMES = new Set<GenieWidgetTheme>(['light', 'dark', 'auto']);

/** Matches server-issued keys: pk_live_ + base64url(32 bytes) ≈ 43 chars. */
export const PK_LIVE_PATTERN = /^pk_live_[A-Za-z0-9_-]{40,50}$/;

const DEFAULT_API_BASE = 'https://genie-api-production-4bb3.up.railway.app';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates GenieWidget.init config. Throws with a clear, prefixed message.
 */
export function validateConfig(config: unknown): Required<
  Pick<GenieWidgetConfig, 'apiKey' | 'assistantId' | 'apiBaseUrl'>
> &
  Pick<GenieWidgetConfig, 'theme' | 'title'> {
  if (config === null || config === undefined || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('GenieWidget: config object is required ({ apiKey, assistantId })');
  }

  const { apiKey, assistantId, theme, title, apiBaseUrl } = config as Record<string, unknown>;

  if (!isNonEmptyString(apiKey)) {
    throw new Error('GenieWidget: apiKey is required (non-empty string)');
  }

  const trimmedKey = apiKey.trim();
  if (!PK_LIVE_PATTERN.test(trimmedKey)) {
    throw new Error('GenieWidget: apiKey must be a pk_live_… publishable key');
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

  if (apiBaseUrl !== undefined) {
    if (typeof apiBaseUrl !== 'string' || !apiBaseUrl.trim()) {
      throw new Error('GenieWidget: apiBaseUrl must be a non-empty string when provided');
    }
  }

  const trimmedTitle = typeof title === 'string' ? title.trim() : undefined;
  const base =
    typeof apiBaseUrl === 'string' && apiBaseUrl.trim()
      ? apiBaseUrl.trim().replace(/\/$/, '')
      : DEFAULT_API_BASE;

  return {
    apiKey: trimmedKey,
    assistantId: assistantId.trim(),
    apiBaseUrl: base,
    theme: (theme as GenieWidgetTheme | undefined) ?? 'auto',
    title: trimmedTitle && trimmedTitle.length > 0 ? trimmedTitle : undefined,
  };
}
