/** Default placeholder until Cloudflare CDN hosts widget.js. */
const DEFAULT_WIDGET_SCRIPT_URL = 'https://cdn.example.com/widget.js';

/** Public widget bundle URL for embed snippets (`NEXT_PUBLIC_WIDGET_SCRIPT_URL`). */
export function getWidgetScriptUrl(): string {
  const configured = process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL?.trim();
  return configured || DEFAULT_WIDGET_SCRIPT_URL;
}
