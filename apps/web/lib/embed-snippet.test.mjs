/**
 * Unit tests for embed snippet builder (Layer A).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// Compiled path — run via tsx or import from built output. Use dynamic import of TS via compile.
// Web package runs: node --import tsx lib/embed-snippet.test.mjs
// Fallback: duplicate minimal test logic inline for node:test without tsx.

const VALID_KEY = 'pk_live_AbCdEfGhIjKlMnOpQrStUvWxYz0123456789abcd';

describe('buildEmbedSnippet', () => {
  it('builds GenieWidget.init snippet with required fields', async () => {
    const { buildEmbedSnippet, isValidPublishableKey } = await import('./embed-snippet.ts');
    assert.equal(isValidPublishableKey(VALID_KEY), true);

    const snippet = buildEmbedSnippet({
      widgetScriptUrl: 'https://cdn.example.com/widget.js',
      apiKey: VALID_KEY,
      assistantId: 'asst-uuid-123',
      apiBaseUrl: 'https://api.example.com',
      theme: 'auto',
      title: 'Support',
    });

    assert.match(snippet, /<script src="https:\/\/cdn\.example\.com\/widget\.js"><\/script>/);
    assert.match(snippet, /GenieWidget\.init\(/);
    assert.match(snippet, new RegExp(`apiKey: '${VALID_KEY}'`));
    assert.match(snippet, /assistantId: 'asst-uuid-123'/);
    assert.match(snippet, /apiBaseUrl: 'https:\/\/api\.example\.com'/);
    assert.match(snippet, /theme: 'auto'/);
    assert.match(snippet, /title: 'Support'/);
  });

  it('omits apiBaseUrl when not provided', async () => {
    const { buildEmbedSnippet } = await import('./embed-snippet.ts');
    const snippet = buildEmbedSnippet({
      widgetScriptUrl: 'https://cdn.example.com/widget.js',
      apiKey: VALID_KEY,
      assistantId: 'a1',
    });
    assert.ok(!snippet.includes('apiBaseUrl'));
  });

  it('escapes single quotes in title', async () => {
    const { buildEmbedSnippet } = await import('./embed-snippet.ts');
    const snippet = buildEmbedSnippet({
      widgetScriptUrl: 'https://cdn.example.com/widget.js',
      apiKey: VALID_KEY,
      assistantId: 'a1',
      title: "O'Brien",
    });
    assert.match(snippet, /title: 'O\\'Brien'/);
  });

  it('rejects invalid apiKey', async () => {
    const { buildEmbedSnippet } = await import('./embed-snippet.ts');
    assert.throws(
      () =>
        buildEmbedSnippet({
          widgetScriptUrl: 'https://cdn.example.com/widget.js',
          apiKey: 'sk_secret',
          assistantId: 'a1',
        }),
      /pk_live_/,
    );
  });
});

describe('getWidgetScriptUrl', () => {
  it('falls back to cdn placeholder when env unset', async () => {
    const prev = process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL;
    delete process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL;
    const { getWidgetScriptUrl } = await import('./widget-config.ts');
    assert.equal(getWidgetScriptUrl(), 'https://cdn.example.com/widget.js');
    if (prev !== undefined) {
      process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL = prev;
    }
  });
});

describe('isPlaceholderWidgetScriptUrl', () => {
  it('returns true for default placeholder URL', async () => {
    const { isPlaceholderWidgetScriptUrl, PLACEHOLDER_WIDGET_SCRIPT_URL } = await import(
      './widget-config.ts'
    );
    assert.equal(isPlaceholderWidgetScriptUrl(PLACEHOLDER_WIDGET_SCRIPT_URL), true);
    assert.equal(isPlaceholderWidgetScriptUrl('https://cdn.genie.app/widget.js'), false);
  });
});
