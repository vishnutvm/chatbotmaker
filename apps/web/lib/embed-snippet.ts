import { isHttpsWidgetScriptUrl } from './widget-config';

export interface EmbedSnippetInput {
  widgetScriptUrl: string;
  apiKey: string;
  assistantId: string;
  apiBaseUrl?: string;
  theme?: 'light' | 'dark' | 'auto';
  title?: string;
}

const PK_LIVE_PATTERN = /^pk_live_[A-Za-z0-9_-]{40,}$/;

/** Validates pk_live shape before embedding in customer HTML. */
export function isValidPublishableKey(apiKey: string): boolean {
  return PK_LIVE_PATTERN.test(apiKey.trim());
}

/**
 * Builds the GenieWidget script-tag embed snippet for copy/paste.
 * Matches docs/features/WIDGET.md contract.
 */
export function buildEmbedSnippet(input: EmbedSnippetInput): string {
  const widgetScriptUrl = input.widgetScriptUrl.trim();
  const apiKey = input.apiKey.trim();
  const assistantId = input.assistantId.trim();

  if (!widgetScriptUrl) {
    throw new Error('widgetScriptUrl is required');
  }
  if (!isHttpsWidgetScriptUrl(widgetScriptUrl)) {
    throw new Error('widgetScriptUrl must be an absolute https URL');
  }
  if (!apiKey) {
    throw new Error('apiKey is required');
  }
  if (!isValidPublishableKey(apiKey)) {
    throw new Error('apiKey must be a pk_live_… publishable key');
  }
  if (!assistantId) {
    throw new Error('assistantId is required');
  }

  const lines: string[] = [
    `  apiKey: '${escapeSingleQuoted(apiKey)}',`,
    `  assistantId: '${escapeSingleQuoted(assistantId)}',`,
  ];

  const apiBaseUrl = input.apiBaseUrl?.trim();
  if (apiBaseUrl) {
    lines.push(`  apiBaseUrl: '${escapeSingleQuoted(apiBaseUrl)}',`);
  }

  const theme = input.theme ?? 'auto';
  if (theme !== 'auto') {
    lines.push(`  theme: '${theme}',`);
  } else {
    lines.push(`  theme: 'auto',`);
  }

  const title = input.title?.trim();
  if (title) {
    lines.push(`  title: '${escapeSingleQuoted(title)}',`);
  }

  return `<script src="${escapeHtmlAttr(widgetScriptUrl)}"></script>
<script>
  GenieWidget.init({
${lines.join('\n')}
  });
</script>`;
}

function escapeSingleQuoted(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
