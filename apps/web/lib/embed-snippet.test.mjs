/**
 * Unit tests for embed snippet builder + widget config (Layer B campaign 6).
 */
import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'node:test';

const VALID_KEY = 'pk_live_AbCdEfGhIjKlMnOpQrStUvWxYz0123456789abcd';
const GCS_WIDGET_URL = 'https://storage.googleapis.com/genie-widget/widget.js';

describe('isHttpsWidgetScriptUrl', () => {
  it('accepts absolute https URLs including GCS CDN bootstrap', async () => {
    const { isHttpsWidgetScriptUrl } = await import('./widget-config.ts');
    assert.equal(isHttpsWidgetScriptUrl(GCS_WIDGET_URL), true);
    assert.equal(isHttpsWidgetScriptUrl('https://cdn.example.com/widget.js'), true);
    assert.equal(isHttpsWidgetScriptUrl(`  ${GCS_WIDGET_URL}  `), true);
  });

  it('rejects non-https schemes', async () => {
    const { isHttpsWidgetScriptUrl } = await import('./widget-config.ts');
    assert.equal(isHttpsWidgetScriptUrl('http://cdn.example.com/widget.js'), false);
    assert.equal(isHttpsWidgetScriptUrl('ftp://cdn.example.com/widget.js'), false);
    assert.equal(isHttpsWidgetScriptUrl('data:text/javascript,alert(1)'), false);
    assert.equal(isHttpsWidgetScriptUrl('file:///tmp/widget.js'), false);
    assert.equal(isHttpsWidgetScriptUrl('blob:https://example.com/uuid'), false);
    assert.equal(isHttpsWidgetScriptUrl('ws://cdn.example.com/widget.js'), false);
    assert.equal(isHttpsWidgetScriptUrl('javascript:alert(1)'), false);
  });

  it('returns false for malformed and relative URLs (catch path)', async () => {
    const { isHttpsWidgetScriptUrl } = await import('./widget-config.ts');
    assert.equal(isHttpsWidgetScriptUrl(''), false);
    assert.equal(isHttpsWidgetScriptUrl('   '), false);
    assert.equal(isHttpsWidgetScriptUrl('not a url'), false);
    assert.equal(isHttpsWidgetScriptUrl('::::'), false);
    assert.equal(isHttpsWidgetScriptUrl('/widget.js'), false);
    assert.equal(isHttpsWidgetScriptUrl('widget.js'), false);
    assert.equal(isHttpsWidgetScriptUrl('//cdn.example.com/widget.js'), false);
  });
});

describe('isValidPublishableKey', () => {
  it('accepts pk_live keys with sufficient suffix length', async () => {
    const { isValidPublishableKey } = await import('./embed-snippet.ts');
    assert.equal(isValidPublishableKey(VALID_KEY), true);
    assert.equal(isValidPublishableKey(`  ${VALID_KEY}  `), true);
  });

  it('rejects secret keys, short suffixes, and empty input', async () => {
    const { isValidPublishableKey } = await import('./embed-snippet.ts');
    assert.equal(isValidPublishableKey('sk_live_' + 'a'.repeat(43)), false);
    assert.equal(isValidPublishableKey('pk_live_short'), false);
    assert.equal(isValidPublishableKey(''), false);
    assert.equal(isValidPublishableKey('   '), false);
  });
});

describe('buildEmbedSnippet', () => {
  it('builds GenieWidget.init snippet with required fields', async () => {
    const { buildEmbedSnippet } = await import('./embed-snippet.ts');

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

  it('includes explicit light and dark themes', async () => {
    const { buildEmbedSnippet } = await import('./embed-snippet.ts');
    const light = buildEmbedSnippet({
      widgetScriptUrl: 'https://cdn.example.com/widget.js',
      apiKey: VALID_KEY,
      assistantId: 'a1',
      theme: 'light',
    });
    const dark = buildEmbedSnippet({
      widgetScriptUrl: 'https://cdn.example.com/widget.js',
      apiKey: VALID_KEY,
      assistantId: 'a1',
      theme: 'dark',
    });
    assert.match(light, /theme: 'light'/);
    assert.match(dark, /theme: 'dark'/);
  });

  it('escapes single quotes and backslashes in string fields', async () => {
    const { buildEmbedSnippet } = await import('./embed-snippet.ts');
    const snippet = buildEmbedSnippet({
      widgetScriptUrl: 'https://cdn.example.com/widget.js',
      apiKey: VALID_KEY,
      assistantId: "id\\'x",
      title: "O'Brien\\help",
    });
    assert.match(snippet, /title: 'O\\'Brien\\\\help'/);
    assert.match(snippet, /assistantId: 'id\\\\\\'x'/);
  });

  it('escapes HTML special characters in script src attribute', async () => {
    const { buildEmbedSnippet } = await import('./embed-snippet.ts');
    const snippet = buildEmbedSnippet({
      widgetScriptUrl: 'https://cdn.example.com/widget.js?x=1&y="2"',
      apiKey: VALID_KEY,
      assistantId: 'a1',
    });
    assert.match(snippet, /src="https:\/\/cdn\.example\.com\/widget\.js\?x=1&amp;y=&quot;2&quot;"/);
  });

  it('omits title when blank after trim', async () => {
    const { buildEmbedSnippet } = await import('./embed-snippet.ts');
    const snippet = buildEmbedSnippet({
      widgetScriptUrl: 'https://cdn.example.com/widget.js',
      apiKey: VALID_KEY,
      assistantId: 'a1',
      title: '   ',
    });
    assert.ok(!snippet.includes('title:'));
  });

  it('trims whitespace from inputs', async () => {
    const { buildEmbedSnippet } = await import('./embed-snippet.ts');
    const snippet = buildEmbedSnippet({
      widgetScriptUrl: '  https://cdn.example.com/widget.js  ',
      apiKey: `  ${VALID_KEY}  `,
      assistantId: '  asst-1  ',
      apiBaseUrl: '  https://api.example.com  ',
    });
    assert.match(snippet, /assistantId: 'asst-1'/);
    assert.match(snippet, /apiBaseUrl: 'https:\/\/api\.example\.com'/);
  });

  it('rejects missing required fields', async () => {
    const { buildEmbedSnippet } = await import('./embed-snippet.ts');
    const base = {
      widgetScriptUrl: 'https://cdn.example.com/widget.js',
      apiKey: VALID_KEY,
      assistantId: 'a1',
    };

    assert.throws(
      () => buildEmbedSnippet({ ...base, widgetScriptUrl: '  ' }),
      /widgetScriptUrl is required/,
    );
    assert.throws(() => buildEmbedSnippet({ ...base, apiKey: '' }), /apiKey is required/);
    assert.throws(
      () => buildEmbedSnippet({ ...base, assistantId: '' }),
      /assistantId is required/,
    );
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

  it('rejects non-https widgetScriptUrl', async () => {
    const { buildEmbedSnippet } = await import('./embed-snippet.ts');
    assert.throws(
      () =>
        buildEmbedSnippet({
          widgetScriptUrl: 'http://cdn.example.com/widget.js',
          apiKey: VALID_KEY,
          assistantId: 'a1',
        }),
      /absolute https URL/,
    );
  });

  it('builds snippet with GCS widget.js URL in script src', async () => {
    const { buildEmbedSnippet } = await import('./embed-snippet.ts');
    const snippet = buildEmbedSnippet({
      widgetScriptUrl: GCS_WIDGET_URL,
      apiKey: VALID_KEY,
      assistantId: 'asst-gcs',
    });
    assert.match(
      snippet,
      /<script src="https:\/\/storage\.googleapis\.com\/genie-widget\/widget\.js"><\/script>/,
    );
    assert.match(snippet, /GenieWidget\.init\(/);
  });

  it('rejects ftp, data, relative, and malformed widgetScriptUrl', async () => {
    const { buildEmbedSnippet } = await import('./embed-snippet.ts');
    const base = { apiKey: VALID_KEY, assistantId: 'a1' };
    for (const widgetScriptUrl of [
      'ftp://cdn.example.com/widget.js',
      'data:text/javascript,alert(1)',
      '/relative/widget.js',
      'not-a-url',
      '',
    ]) {
      assert.throws(
        () => buildEmbedSnippet({ ...base, widgetScriptUrl }),
        /widgetScriptUrl/,
      );
    }
  });

  it('escapes angle brackets in script src attribute', async () => {
    const { buildEmbedSnippet } = await import('./embed-snippet.ts');
    const snippet = buildEmbedSnippet({
      widgetScriptUrl: 'https://cdn.example.com/widget.js?x=<script>&y=>',
      apiKey: VALID_KEY,
      assistantId: 'a1',
    });
    assert.match(
      snippet,
      /src="https:\/\/cdn\.example\.com\/widget\.js\?x=&lt;script&gt;&amp;y=&gt;"/,
    );
  });

  it('omits apiBaseUrl when blank after trim', async () => {
    const { buildEmbedSnippet } = await import('./embed-snippet.ts');
    const snippet = buildEmbedSnippet({
      widgetScriptUrl: 'https://cdn.example.com/widget.js',
      apiKey: VALID_KEY,
      assistantId: 'a1',
      apiBaseUrl: '   ',
    });
    assert.ok(!snippet.includes('apiBaseUrl'));
  });
});

describe('getWidgetScriptUrl', () => {
  let prev;

  beforeEach(() => {
    prev = process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL;
  });

  afterEach(() => {
    if (prev === undefined) {
      delete process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL;
    } else {
      process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL = prev;
    }
  });

  it('falls back to cdn placeholder when env unset', async () => {
    delete process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL;
    const { getWidgetScriptUrl } = await import('./widget-config.ts');
    assert.equal(getWidgetScriptUrl(), 'https://cdn.example.com/widget.js');
  });

  it('returns trimmed configured URL when env is set', async () => {
    process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL = '  https://cdn.genie.app/widget.js  ';
    const { getWidgetScriptUrl } = await import('./widget-config.ts');
    assert.equal(getWidgetScriptUrl(), 'https://cdn.genie.app/widget.js');
  });

  it('falls back when env is whitespace-only', async () => {
    process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL = '   ';
    const { getWidgetScriptUrl, PLACEHOLDER_WIDGET_SCRIPT_URL } = await import(
      './widget-config.ts'
    );
    assert.equal(getWidgetScriptUrl(), PLACEHOLDER_WIDGET_SCRIPT_URL);
  });

  it('falls back when env is not https', async () => {
    process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL = 'http://cdn.genie.app/widget.js';
    const { getWidgetScriptUrl, PLACEHOLDER_WIDGET_SCRIPT_URL } = await import(
      './widget-config.ts'
    );
    assert.equal(getWidgetScriptUrl(), PLACEHOLDER_WIDGET_SCRIPT_URL);
  });

  it('falls back for protocol-relative and javascript URLs', async () => {
    const { getWidgetScriptUrl, PLACEHOLDER_WIDGET_SCRIPT_URL } = await import(
      './widget-config.ts'
    );
    process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL = '//evil.example/widget.js';
    assert.equal(getWidgetScriptUrl(), PLACEHOLDER_WIDGET_SCRIPT_URL);
    process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL = 'javascript:alert(1)';
    assert.equal(getWidgetScriptUrl(), PLACEHOLDER_WIDGET_SCRIPT_URL);
  });

  it('returns live GCS CDN URL when env is set', async () => {
    process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL = `  ${GCS_WIDGET_URL}  `;
    const { getWidgetScriptUrl } = await import('./widget-config.ts');
    assert.equal(getWidgetScriptUrl(), GCS_WIDGET_URL);
  });

  it('falls back for malformed and non-https ftp/data env values', async () => {
    const { getWidgetScriptUrl, PLACEHOLDER_WIDGET_SCRIPT_URL } = await import(
      './widget-config.ts'
    );
    process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL = 'not-a-url';
    assert.equal(getWidgetScriptUrl(), PLACEHOLDER_WIDGET_SCRIPT_URL);
    process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL = 'ftp://cdn.example.com/widget.js';
    assert.equal(getWidgetScriptUrl(), PLACEHOLDER_WIDGET_SCRIPT_URL);
    process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL = 'data:text/javascript,alert(1)';
    assert.equal(getWidgetScriptUrl(), PLACEHOLDER_WIDGET_SCRIPT_URL);
  });

  it('documents production CDN URL pattern', async () => {
    const { PRODUCTION_WIDGET_SCRIPT_URL_PATTERN } = await import('./widget-config.ts');
    assert.equal(
      PRODUCTION_WIDGET_SCRIPT_URL_PATTERN,
      'https://cdn.<your-domain>/widget.js',
    );
  });
});

describe('isPlaceholderWidgetScriptUrl', () => {
  it('returns true for default placeholder URL', async () => {
    const { isPlaceholderWidgetScriptUrl, PLACEHOLDER_WIDGET_SCRIPT_URL } = await import(
      './widget-config.ts'
    );
    assert.equal(isPlaceholderWidgetScriptUrl(PLACEHOLDER_WIDGET_SCRIPT_URL), true);
    assert.equal(isPlaceholderWidgetScriptUrl('https://cdn.genie.app/widget.js'), false);
    assert.equal(isPlaceholderWidgetScriptUrl(GCS_WIDGET_URL), false);
  });

  it('uses getWidgetScriptUrl when url argument omitted', async () => {
    const prev = process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL;
    process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL = 'https://cdn.genie.app/widget.js';
    const { isPlaceholderWidgetScriptUrl } = await import('./widget-config.ts');
    assert.equal(isPlaceholderWidgetScriptUrl(), false);
    if (prev === undefined) {
      delete process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL;
    } else {
      process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL = prev;
    }
  });

  it('returns true when url omitted and env unset', async () => {
    const prev = process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL;
    delete process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL;
    const { isPlaceholderWidgetScriptUrl } = await import('./widget-config.ts');
    assert.equal(isPlaceholderWidgetScriptUrl(), true);
    if (prev === undefined) {
      delete process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL;
    } else {
      process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL = prev;
    }
  });

  it('trims url before comparing', async () => {
    const { isPlaceholderWidgetScriptUrl, PLACEHOLDER_WIDGET_SCRIPT_URL } = await import(
      './widget-config.ts'
    );
    assert.equal(
      isPlaceholderWidgetScriptUrl(`  ${PLACEHOLDER_WIDGET_SCRIPT_URL}  `),
      true,
    );
  });
});
