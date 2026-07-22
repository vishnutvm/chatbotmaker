/** Default placeholder until Cloudflare CDN hosts widget.js. */
export const PLACEHOLDER_WIDGET_SCRIPT_URL = 'https://cdn.example.com/widget.js';

/** Public widget bundle URL for embed snippets (`NEXT_PUBLIC_WIDGET_SCRIPT_URL`). */
export function getWidgetScriptUrl(): string {
  const configured = process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL?.trim();
  return configured || PLACEHOLDER_WIDGET_SCRIPT_URL;
}

/** True when the dashboard is still using the default placeholder widget script URL. */
export function isPlaceholderWidgetScriptUrl(url?: string): boolean {
  const value = (url ?? getWidgetScriptUrl()).trim();
  return value === PLACEHOLDER_WIDGET_SCRIPT_URL;
}
