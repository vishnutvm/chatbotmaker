/** Default placeholder until Cloudflare CDN hosts widget.js. */
export const PLACEHOLDER_WIDGET_SCRIPT_URL = 'https://cdn.example.com/widget.js';

/**
 * Production URL pattern after Cloudflare R2 + custom domain (see docs/deployment/WIDGET_CDN.md):
 *   https://cdn.<your-domain>/widget.js
 *
 * Set `NEXT_PUBLIC_WIDGET_SCRIPT_URL` in Vercel to the live CDN URL.
 */
export const PRODUCTION_WIDGET_SCRIPT_URL_PATTERN = 'https://cdn.<your-domain>/widget.js';

/** True when `url` is an absolute https URL suitable for embed script src. */
export function isHttpsWidgetScriptUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Public widget bundle URL for embed snippets (`NEXT_PUBLIC_WIDGET_SCRIPT_URL`). */
export function getWidgetScriptUrl(): string {
  const configured = process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL?.trim();
  if (!configured) {
    return PLACEHOLDER_WIDGET_SCRIPT_URL;
  }
  if (!isHttpsWidgetScriptUrl(configured)) {
    return PLACEHOLDER_WIDGET_SCRIPT_URL;
  }
  return configured;
}

/** True when the dashboard is still using the default placeholder widget script URL. */
export function isPlaceholderWidgetScriptUrl(url?: string): boolean {
  const value = (url ?? getWidgetScriptUrl()).trim();
  return value === PLACEHOLDER_WIDGET_SCRIPT_URL;
}
