/**
 * Layer A tests for the minified IIFE bundle (bubble + panel UI + pk_live bootstrap + SSE chat).
 * Run after `pnpm build` — invoked by package.json `test` script.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, before, beforeEach, afterEach } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundlePath = path.join(root, 'dist', 'widget.js');

/** Valid pk_live shape (40+ suffix chars). */
const VALID_KEY = 'pk_live_AbCdEfGhIjKlMnOpQrStUvWxYz0123456789abcd';
const VALID_KEY_2 = 'pk_live_ZyXwVuTsRqPoNmLkJiHgFeDcBa9876543210zyxw';

/**
 * Build a fetch Response-like object with a ReadableStream SSE body.
 * @param {string} sseText
 * @param {{
 *   ok?: boolean,
 *   status?: number,
 *   jsonBody?: unknown,
 *   signal?: AbortSignal,
 *   holdOpen?: boolean,
 *   holdOpenPreface?: string,
 * }} [opts]
 */
function mockSseResponse(sseText, opts = {}) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      if (opts.holdOpen) {
        const preface =
          opts.holdOpenPreface !== undefined
            ? opts.holdOpenPreface
            : 'event: delta\ndata: {"content":"partial"}\n\n';
        if (preface) {
          controller.enqueue(encoder.encode(preface));
        }
        const onAbort = () => {
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        };
        if (opts.signal?.aborted) {
          onAbort();
          return;
        }
        opts.signal?.addEventListener('abort', onAbort, { once: true });
        return;
      }
      controller.enqueue(encoder.encode(sseText));
      controller.close();
    },
  });
  return {
    ok: opts.ok !== false,
    status: opts.status ?? 200,
    body: stream,
    json: async () => opts.jsonBody ?? {},
  };
}

const DEFAULT_SSE = [
  'event: meta',
  'data: {"organizationId":"org_smoke","model":"gpt-test"}',
  '',
  'event: delta',
  'data: {"content":"Hello"}',
  '',
  'event: delta',
  'data: {"content":" from stream"}',
  '',
  'event: done',
  'data: {"finishReason":"stop","usage":{"promptTokens":1,"completionTokens":2,"totalTokens":3}}',
  '',
].join('\n');

/**
 * @param {{
 *   dark?: boolean,
 *   legacyMedia?: boolean,
 *   bootstrapOk?: boolean,
 *   bootstrapStatus?: number,
 *   streamSse?: string,
 *   streamHttpStatus?: number,
 *   streamJsonBody?: unknown,
 *   streamHoldOpen?: boolean,
 *   streamHoldOpenPreface?: string,
 * }} [mediaOpts]
 */
function loadWidgetWithDom(mediaOpts = {}) {
  const { window, document } = parseHTML('<!doctype html><html><body></body></html>');
  /** @type {Array<() => void>} */
  const mediaListeners = [];
  const dark = Boolean(mediaOpts.dark);
  const legacyMedia = Boolean(mediaOpts.legacyMedia);
  const bootstrapOk = mediaOpts.bootstrapOk !== false;
  const bootstrapStatus = mediaOpts.bootstrapStatus ?? (bootstrapOk ? 200 : 401);
  const streamHttpStatus = mediaOpts.streamHttpStatus;
  const streamSse = mediaOpts.streamSse ?? DEFAULT_SSE;
  const streamHoldOpen = Boolean(mediaOpts.streamHoldOpen);
  const streamHoldOpenPreface = mediaOpts.streamHoldOpenPreface;

  /** @type {AbortSignal[]} */
  const streamSignals = [];

  window.matchMedia = (query) => {
    const mql = {
      matches: String(query).includes('dark') ? dark : false,
      media: String(query),
      addEventListener(_type, listener) {
        mediaListeners.push(listener);
      },
      removeEventListener(_type, listener) {
        const idx = mediaListeners.indexOf(listener);
        if (idx >= 0) mediaListeners.splice(idx, 1);
      },
      addListener(listener) {
        mediaListeners.push(listener);
      },
      removeListener(listener) {
        const idx = mediaListeners.indexOf(listener);
        if (idx >= 0) mediaListeners.splice(idx, 1);
      },
    };
    if (legacyMedia) {
      delete mql.addEventListener;
      delete mql.removeEventListener;
    }
    return mql;
  };

  /** @type {Array<{ url: string, method: string, headers: Record<string, string>, body?: string }>} */
  const fetchCalls = [];
  window.fetch = async (input, init = {}) => {
    const url = String(input);
    const method = String(init.method ?? 'GET').toUpperCase();
    const headers = /** @type {Record<string, string>} */ (init.headers ?? {});
    const body = typeof init.body === 'string' ? init.body : undefined;
    fetchCalls.push({ url, method, headers, body });

    if (url.includes('/public/widget/chat/stream')) {
      const signal = /** @type {AbortSignal | undefined} */ (init.signal);
      if (signal) streamSignals.push(signal);
      if (typeof streamHttpStatus === 'number' && streamHttpStatus >= 400) {
        return {
          ok: false,
          status: streamHttpStatus,
          body: null,
          json: async () => mediaOpts.streamJsonBody ?? { message: 'fail' },
        };
      }
      return mockSseResponse(streamSse, {
        signal,
        holdOpen: streamHoldOpen,
        holdOpenPreface: streamHoldOpenPreface,
      });
    }

    if (!bootstrapOk) {
      return {
        ok: false,
        status: bootstrapStatus,
        json: async () => ({ message: 'fail' }),
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        assistantId: 'asst_smoke',
        organizationId: 'org_smoke',
        name: 'Smoke Bot',
        welcomeMessage: 'Welcome from bootstrap',
        appearance: {},
      }),
    };
  };

  const code = fs.readFileSync(bundlePath, 'utf8');
  const sandbox = {
    console,
    window,
    document,
    fetch: window.fetch,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    TextEncoder: globalThis.TextEncoder,
    TextDecoder: globalThis.TextDecoder,
    AbortController: globalThis.AbortController,
    ReadableStream: globalThis.ReadableStream,
  };
  Object.defineProperty(sandbox, 'globalThis', { value: sandbox });
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  const api = /** @type {{ init: Function, destroy: Function, open: Function, close: Function, version: string }} */ (
    sandbox.GenieWidget
  );
  return { api, document, window, mediaListeners, fetchCalls, streamSignals };
}

async function waitForAuth(document, state, timeoutMs = 500) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const root = document.getElementById('genie-widget-root')?.shadowRoot?.querySelector('.gw-root');
    if (root?.dataset.auth === state) return;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error(`Timed out waiting for auth=${state}`);
}

/**
 * Wait until an assistant bubble contains the expected text (stream finished).
 */
async function waitForAssistantText(shadow, expected, timeoutMs = 1000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const botMsgs = shadow.querySelectorAll('.gw-msg[data-role="assistant"]');
    const last = botMsgs[botMsgs.length - 1];
    if (last && last.textContent === expected) return last;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error(`Timed out waiting for assistant text: ${expected}`);
}

describe('widget.js IIFE bundle', () => {
  /** @type {string} */
  let code;

  before(() => {
    assert.ok(fs.existsSync(bundlePath), `Missing ${bundlePath} — run pnpm build first`);
    code = fs.readFileSync(bundlePath, 'utf8');
  });

  it('emits a non-empty minified widget.js', () => {
    assert.ok(code.length > 100);
    assert.match(code, /GenieWidget/);
  });

  it('does not embed Next/dashboard/React runtime markers', () => {
    assert.ok(!/from\s*["']next/.test(code));
    assert.ok(!/@genie\/web/.test(code));
    assert.ok(!/react-dom/.test(code));
    assert.ok(!/__NEXT_DATA__/.test(code));
  });

  it('includes live chat stream path (no Phase 7 placeholder)', () => {
    assert.match(code, /chat\/stream/);
    assert.ok(!/Phase 7/.test(code));
    assert.ok(!/Live assistant replies connect in a later/.test(code));
  });

  it('exposes GenieWidget.init/open/close/destroy and version on the global', () => {
    const { api } = loadWidgetWithDom();
    assert.equal(typeof api.init, 'function');
    assert.equal(typeof api.open, 'function');
    assert.equal(typeof api.close, 'function');
    assert.equal(typeof api.destroy, 'function');
    assert.match(api.version, /^\d+\.\d+\.\d+$/);
  });

  it('rejects missing or blank apiKey', () => {
    const { api } = loadWidgetWithDom();
    assert.throws(() => api.init({ assistantId: 'asst_1' }), /apiKey is required/);
    assert.throws(() => api.init({ apiKey: '  ', assistantId: 'asst_1' }), /apiKey is required/);
  });

  it('rejects non-pk_live apiKey', () => {
    const { api } = loadWidgetWithDom();
    assert.throws(
      () => api.init({ apiKey: 'key_1', assistantId: 'asst_1' }),
      /pk_live_/,
    );
  });

  it('rejects missing or blank assistantId', () => {
    const { api } = loadWidgetWithDom();
    assert.throws(() => api.init({ apiKey: VALID_KEY }), /assistantId is required/);
    assert.throws(() => api.init({ apiKey: VALID_KEY, assistantId: '' }), /assistantId is required/);
  });

  it('rejects non-object config', () => {
    const { api } = loadWidgetWithDom();
    assert.throws(() => api.init(null), /config object is required/);
    assert.throws(() => api.init('x'), /config object is required/);
  });

  it('rejects invalid theme', () => {
    const { api } = loadWidgetWithDom();
    assert.throws(
      () => api.init({ apiKey: VALID_KEY, assistantId: 'a', theme: 'neon' }),
      /theme must be/,
    );
  });

  it('rejects non-string title', () => {
    const { api } = loadWidgetWithDom();
    assert.throws(
      () => api.init({ apiKey: VALID_KEY, assistantId: 'a', title: 42 }),
      /title must be a string/,
    );
  });

  it('open/close/destroy are no-ops before init', () => {
    const { api, document } = loadWidgetWithDom();
    assert.doesNotThrow(() => api.open());
    assert.doesNotThrow(() => api.close());
    assert.doesNotThrow(() => api.destroy());
    assert.equal(document.getElementById('genie-widget-root'), null);
  });
});

describe('widget bubble + panel UI', () => {
  /** @type {{ api: any, document: Document, window: any, mediaListeners: Array<() => void>, fetchCalls: any[] }} */
  let ctx;

  beforeEach(() => {
    ctx = loadWidgetWithDom();
  });

  afterEach(() => {
    try {
      ctx.api.destroy();
    } catch {
      /* ignore */
    }
  });

  it('mounts a Shadow DOM host with bubble and panel', async () => {
    const { api, document, fetchCalls } = ctx;
    api.init({
      apiKey: VALID_KEY,
      assistantId: 'asst_smoke',
      theme: 'light',
      apiBaseUrl: 'https://api.test',
    });

    const host = document.getElementById('genie-widget-root');
    assert.ok(host);
    assert.ok(host.shadowRoot);

    const bubble = host.shadowRoot.getElementById('gw-bubble');
    const panel = host.shadowRoot.getElementById('gw-panel');
    assert.ok(bubble);
    assert.ok(panel);
    assert.equal(panel.hasAttribute('hidden'), true);
    assert.equal(bubble.getAttribute('aria-expanded'), 'false');

    await waitForAuth(document, 'ready');
    assert.ok(fetchCalls.length >= 1);
    assert.match(fetchCalls[0].url, /assistantId=asst_smoke/);
    assert.equal(fetchCalls[0].headers['X-Genie-Public-Key'], VALID_KEY);
    assert.ok(!fetchCalls[0].url.includes(VALID_KEY));
  });

  it('toggles panel open/close via bubble and API', async () => {
    const { api, document } = ctx;
    api.init({
      apiKey: VALID_KEY,
      assistantId: 'asst_smoke',
      theme: 'dark',
      title: 'Support',
      apiBaseUrl: 'https://api.test',
    });
    await waitForAuth(document, 'ready');

    const host = document.getElementById('genie-widget-root');
    const shadow = host.shadowRoot;
    const bubble = shadow.getElementById('gw-bubble');
    const panel = shadow.getElementById('gw-panel');
    const title = shadow.getElementById('gw-title');

    assert.equal(title.textContent, 'Support');
    assert.equal(shadow.querySelector('.gw-root').dataset.theme, 'dark');

    bubble.click();
    assert.equal(panel.hasAttribute('hidden'), false);
    assert.equal(bubble.getAttribute('aria-expanded'), 'true');

    api.close();
    assert.equal(panel.hasAttribute('hidden'), true);

    api.open();
    assert.equal(panel.hasAttribute('hidden'), false);
  });

  it('closes via header button and Escape key', async () => {
    const { api, document } = ctx;
    api.init({ apiKey: VALID_KEY, assistantId: 'asst_smoke', apiBaseUrl: 'https://api.test' });
    await waitForAuth(document, 'ready');
    api.open();

    const host = document.getElementById('genie-widget-root');
    const shadow = host.shadowRoot;
    const panel = shadow.getElementById('gw-panel');
    const closeBtn = shadow.querySelector('.gw-close');

    closeBtn.click();
    assert.equal(panel.hasAttribute('hidden'), true);

    api.open();
    const escape = new document.defaultView.Event('keydown', { bubbles: true });
    Object.defineProperty(escape, 'key', { value: 'Escape' });
    host.dispatchEvent(escape);
    assert.equal(panel.hasAttribute('hidden'), true);
  });

  it('shows error state when bootstrap fails', async () => {
    const failCtx = loadWidgetWithDom({ bootstrapOk: false, bootstrapStatus: 401 });
    failCtx.api.init({
      apiKey: VALID_KEY,
      assistantId: 'asst_smoke',
      apiBaseUrl: 'https://api.test',
    });
    await waitForAuth(failCtx.document, 'error');
    const status = failCtx.document
      .getElementById('genie-widget-root')
      .shadowRoot.getElementById('gw-status');
    assert.equal(status.hidden, false);
    assert.match(status.textContent, /Invalid|revoked|public key/i);
    failCtx.api.destroy();
  });

  it('ignores empty composer submits', async () => {
    const { api, document } = ctx;
    api.init({ apiKey: VALID_KEY, assistantId: 'asst_smoke', apiBaseUrl: 'https://api.test' });
    await waitForAuth(document, 'ready');
    api.open();

    const shadow = document.getElementById('genie-widget-root').shadowRoot;
    const form = shadow.getElementById('gw-form');
    const input = shadow.getElementById('gw-input');

    input.value = '   ';
    form.dispatchEvent(
      new shadow.ownerDocument.defaultView.Event('submit', { bubbles: true, cancelable: true }),
    );

    // welcome from bootstrap may exist; empty submit should not add user message
    const userMsgs = shadow.querySelectorAll('.gw-msg[data-role="user"]');
    assert.equal(userMsgs.length, 0);
  });

  it('sets title via textContent (no HTML injection)', async () => {
    const { api, document } = ctx;
    api.init({
      apiKey: VALID_KEY,
      assistantId: 'asst_smoke',
      title: '<img src=x onerror=alert(1)>',
      apiBaseUrl: 'https://api.test',
    });
    await waitForAuth(document, 'ready');

    const title = document.getElementById('genie-widget-root').shadowRoot.getElementById('gw-title');
    assert.equal(title.textContent, '<img src=x onerror=alert(1)>');
    assert.equal(title.querySelectorAll('img').length, 0);
  });

  it('defaults blank title to server name after bootstrap', async () => {
    const { api, document } = ctx;
    api.init({
      apiKey: VALID_KEY,
      assistantId: 'asst_smoke',
      theme: 'auto',
      title: '   ',
      apiBaseUrl: 'https://api.test',
    });
    await waitForAuth(document, 'ready');

    const shadow = document.getElementById('genie-widget-root').shadowRoot;
    assert.equal(shadow.getElementById('gw-title').textContent, 'Smoke Bot');
    assert.equal(shadow.querySelector('.gw-root').dataset.theme, 'light');
  });

  it('streams assistant reply via POST chat/stream SSE', async () => {
    const { api, document, fetchCalls } = ctx;
    api.init({ apiKey: VALID_KEY, assistantId: 'asst_smoke', apiBaseUrl: 'https://api.test' });
    await waitForAuth(document, 'ready');
    api.open();

    const shadow = document.getElementById('genie-widget-root').shadowRoot;
    const input = shadow.getElementById('gw-input');
    const form = shadow.getElementById('gw-form');
    const sendBtn = shadow.querySelector('.gw-send');

    input.value = 'Hello Genie';
    form.dispatchEvent(
      new shadow.ownerDocument.defaultView.Event('submit', { bubbles: true, cancelable: true }),
    );

    const userMsgs = shadow.querySelectorAll('.gw-msg[data-role="user"]');
    assert.equal(userMsgs.length, 1);
    assert.equal(userMsgs[0].textContent, 'Hello Genie');

    // Composer disabled while stream in flight (may already finish on sync ReadableStream)
    await waitForAssistantText(shadow, 'Hello from stream');

    const streamCall = fetchCalls.find((c) => c.url.includes('/public/widget/chat/stream'));
    assert.ok(streamCall, 'expected POST to chat/stream');
    assert.equal(streamCall.method, 'POST');
    assert.equal(streamCall.headers['X-Genie-Public-Key'], VALID_KEY);
    assert.equal(streamCall.headers.Accept, 'text/event-stream');
    assert.ok(!streamCall.url.includes(VALID_KEY));
    assert.ok(!streamCall.url.includes('apiKey'));

    const body = JSON.parse(streamCall.body);
    assert.equal(body.assistantId, 'asst_smoke');
    assert.ok(Array.isArray(body.messages));
    assert.ok(body.messages.some((m) => m.role === 'user' && m.content === 'Hello Genie'));

    const botMsgs = shadow.querySelectorAll('.gw-msg[data-role="assistant"]');
    assert.ok(botMsgs.length >= 2); // welcome + streamed reply
    assert.equal(botMsgs[botMsgs.length - 1].textContent, 'Hello from stream');
    assert.ok(!/Phase 7/.test(botMsgs[botMsgs.length - 1].textContent));

    assert.equal(input.disabled, false);
    assert.equal(sendBtn.disabled, false);
  });

  it('shows recoverable error on chat stream HTTP 429', async () => {
    const errCtx = loadWidgetWithDom({ streamHttpStatus: 429 });
    errCtx.api.init({
      apiKey: VALID_KEY,
      assistantId: 'asst_smoke',
      apiBaseUrl: 'https://api.test',
    });
    await waitForAuth(errCtx.document, 'ready');
    errCtx.api.open();

    const shadow = errCtx.document.getElementById('genie-widget-root').shadowRoot;
    const input = shadow.getElementById('gw-input');
    const form = shadow.getElementById('gw-form');
    const sendBtn = shadow.querySelector('.gw-send');

    input.value = 'Rate limit me';
    form.dispatchEvent(
      new shadow.ownerDocument.defaultView.Event('submit', { bubbles: true, cancelable: true }),
    );

    const start = Date.now();
    let status;
    while (Date.now() - start < 1000) {
      status = shadow.getElementById('gw-status');
      if (status && !status.hidden && /Too many requests/i.test(status.textContent)) break;
      await new Promise((r) => setTimeout(r, 10));
    }
    assert.ok(status && !status.hidden);
    assert.match(status.textContent, /Too many requests/i);
    assert.equal(input.disabled, false);
    assert.equal(sendBtn.disabled, false);
    errCtx.api.destroy();
  });

  it('marks in-flight assistant bubble and aria-busy until first delta', async () => {
    const holdCtx = loadWidgetWithDom({
      streamHoldOpen: true,
      streamHoldOpenPreface: '', // hang with no deltas
    });
    holdCtx.api.init({
      apiKey: VALID_KEY,
      assistantId: 'asst_smoke',
      apiBaseUrl: 'https://api.test',
    });
    await waitForAuth(holdCtx.document, 'ready');
    holdCtx.api.open();

    const shadow = holdCtx.document.getElementById('genie-widget-root').shadowRoot;
    const panel = shadow.getElementById('gw-panel');
    const messages = shadow.getElementById('gw-messages');
    const input = shadow.getElementById('gw-input');
    const form = shadow.getElementById('gw-form');

    input.value = 'Waiting affordance';
    form.dispatchEvent(
      new shadow.ownerDocument.defaultView.Event('submit', { bubbles: true, cancelable: true }),
    );

    const start = Date.now();
    /** @type {HTMLElement | null} */
    let streamingBubble = null;
    while (Date.now() - start < 1000) {
      const bots = shadow.querySelectorAll('.gw-msg[data-role="assistant"][data-streaming="true"]');
      streamingBubble = bots[bots.length - 1] ?? null;
      if (streamingBubble && panel.getAttribute('aria-busy') === 'true') break;
      await new Promise((r) => setTimeout(r, 10));
    }
    assert.ok(streamingBubble, 'expected data-streaming assistant bubble');
    assert.equal(streamingBubble.getAttribute('aria-busy'), 'true');
    assert.equal(streamingBubble.textContent, '');
    assert.equal(panel.getAttribute('aria-busy'), 'true');
    assert.equal(messages.getAttribute('aria-busy'), 'true');
    assert.equal(input.disabled, true);

    holdCtx.api.close();
    holdCtx.api.destroy();
  });

  it('aborts in-flight stream when panel closes and keeps partial reply', async () => {
    const holdCtx = loadWidgetWithDom({ streamHoldOpen: true });
    holdCtx.api.init({
      apiKey: VALID_KEY,
      assistantId: 'asst_smoke',
      apiBaseUrl: 'https://api.test',
    });
    await waitForAuth(holdCtx.document, 'ready');
    holdCtx.api.open();

    const shadow = holdCtx.document.getElementById('genie-widget-root').shadowRoot;
    const input = shadow.getElementById('gw-input');
    const form = shadow.getElementById('gw-form');
    const sendBtn = shadow.querySelector('.gw-send');
    const panel = shadow.getElementById('gw-panel');
    const messages = shadow.getElementById('gw-messages');

    input.value = 'Abort on close';
    form.dispatchEvent(
      new shadow.ownerDocument.defaultView.Event('submit', { bubbles: true, cancelable: true }),
    );

    await waitForAssistantText(shadow, 'partial');
    assert.equal(holdCtx.streamSignals.length, 1);
    assert.equal(holdCtx.streamSignals[0].aborted, false);

    holdCtx.api.close();

    const start = Date.now();
    while (Date.now() - start < 1000) {
      if (holdCtx.streamSignals[0].aborted && !input.disabled) break;
      await new Promise((r) => setTimeout(r, 10));
    }
    assert.equal(holdCtx.streamSignals[0].aborted, true);
    assert.equal(input.disabled, false);
    assert.equal(sendBtn.disabled, false);
    assert.equal(panel.hasAttribute('aria-busy'), false);
    assert.equal(messages.hasAttribute('aria-busy'), false);

    // Partial text is kept; streaming marker cleared.
    const botMsgs = shadow.querySelectorAll('.gw-msg[data-role="assistant"]');
    const last = botMsgs[botMsgs.length - 1];
    assert.equal(last.textContent, 'partial');
    assert.equal(last.hasAttribute('data-streaming'), false);

    // Abort must not surface a visitor error.
    const status = shadow.getElementById('gw-status');
    assert.ok(status.hidden || !/Something went wrong|Network error|Connection lost/i.test(status.textContent));
    holdCtx.api.destroy();
  });

  it('removes empty assistant bubble when stream aborts before first delta', async () => {
    const holdCtx = loadWidgetWithDom({
      streamHoldOpen: true,
      streamHoldOpenPreface: '',
    });
    holdCtx.api.init({
      apiKey: VALID_KEY,
      assistantId: 'asst_smoke',
      apiBaseUrl: 'https://api.test',
    });
    await waitForAuth(holdCtx.document, 'ready');
    holdCtx.api.open();

    const shadow = holdCtx.document.getElementById('genie-widget-root').shadowRoot;
    const input = shadow.getElementById('gw-input');
    const form = shadow.getElementById('gw-form');
    const messages = shadow.getElementById('gw-messages');

    const botsBefore = shadow.querySelectorAll('.gw-msg[data-role="assistant"]').length;

    input.value = 'Abort empty bubble';
    form.dispatchEvent(
      new shadow.ownerDocument.defaultView.Event('submit', { bubbles: true, cancelable: true }),
    );

    // Wait until streaming bubble exists
    const startWait = Date.now();
    while (Date.now() - startWait < 1000) {
      if (shadow.querySelector('.gw-msg[data-role="assistant"][data-streaming="true"]')) break;
      await new Promise((r) => setTimeout(r, 10));
    }
    assert.ok(shadow.querySelector('.gw-msg[data-role="assistant"][data-streaming="true"]'));

    holdCtx.api.close();

    const start = Date.now();
    while (Date.now() - start < 1000) {
      if (
        holdCtx.streamSignals[0]?.aborted &&
        !shadow.querySelector('.gw-msg[data-role="assistant"][data-streaming="true"]') &&
        !messages.hasAttribute('aria-busy')
      ) {
        break;
      }
      await new Promise((r) => setTimeout(r, 10));
    }

    assert.equal(holdCtx.streamSignals[0].aborted, true);
    assert.equal(messages.hasAttribute('aria-busy'), false);
    // Empty in-flight assistant removed; welcome (if any) remains.
    const botsAfter = shadow.querySelectorAll('.gw-msg[data-role="assistant"]');
    assert.equal(botsAfter.length, botsBefore);
    for (const el of botsAfter) {
      assert.ok(el.textContent.trim().length > 0);
      assert.equal(el.hasAttribute('data-streaming'), false);
    }

    const status = shadow.getElementById('gw-status');
    assert.ok(status.hidden || !/Something went wrong|Network error|Connection lost/i.test(status.textContent));
    holdCtx.api.destroy();
  });

  it('shows generic error for unknown HTTP status codes', async () => {
    const errCtx = loadWidgetWithDom({ streamHttpStatus: 418 });
    errCtx.api.init({
      apiKey: VALID_KEY,
      assistantId: 'asst_smoke',
      apiBaseUrl: 'https://api.test',
    });
    await waitForAuth(errCtx.document, 'ready');
    errCtx.api.open();

    const shadow = errCtx.document.getElementById('genie-widget-root').shadowRoot;
    const form = shadow.getElementById('gw-form');
    shadow.getElementById('gw-input').value = 'Teapot';
    form.dispatchEvent(
      new shadow.ownerDocument.defaultView.Event('submit', { bubbles: true, cancelable: true }),
    );

    const start = Date.now();
    let status;
    while (Date.now() - start < 1000) {
      status = shadow.getElementById('gw-status');
      if (status && !status.hidden && /Something went wrong/i.test(status.textContent)) break;
      await new Promise((r) => setTimeout(r, 10));
    }
    assert.ok(status && !status.hidden);
    assert.match(status.textContent, /Something went wrong — try again\./);
    assert.ok(!/418|Request failed/i.test(status.textContent));
    errCtx.api.destroy();
  });

  it('maps SSE error events to visitor-safe messages (no raw server message)', async () => {
    const raw =
      'Upstream model request failed with internal stack trace and org secrets';
    const errCtx = loadWidgetWithDom({
      streamSse: [
        'event: error',
        `data: {"statusCode":502,"code":"AI_PROVIDER_ERROR","message":${JSON.stringify(raw)}}`,
        '',
      ].join('\n'),
    });
    errCtx.api.init({
      apiKey: VALID_KEY,
      assistantId: 'asst_smoke',
      apiBaseUrl: 'https://api.test',
    });
    await waitForAuth(errCtx.document, 'ready');
    errCtx.api.open();

    const shadow = errCtx.document.getElementById('genie-widget-root').shadowRoot;
    const input = shadow.getElementById('gw-input');
    const form = shadow.getElementById('gw-form');

    input.value = 'Trigger SSE error';
    form.dispatchEvent(
      new shadow.ownerDocument.defaultView.Event('submit', { bubbles: true, cancelable: true }),
    );

    const start = Date.now();
    let status;
    while (Date.now() - start < 1000) {
      status = shadow.getElementById('gw-status');
      if (status && !status.hidden && status.textContent) break;
      await new Promise((r) => setTimeout(r, 10));
    }
    assert.ok(status && !status.hidden);
    assert.match(status.textContent, /Something went wrong/i);
    assert.ok(!status.textContent.includes(raw));
    assert.ok(!/Upstream model|stack trace|org secrets/i.test(status.textContent));
    errCtx.api.destroy();
  });

  it('maps SSE error statusCode 429 to rate-limit copy', async () => {
    const errCtx = loadWidgetWithDom({
      streamSse: [
        'event: error',
        'data: {"statusCode":429,"code":"RATE_LIMITED","message":"key bucket exhausted — retry-after 12s"}',
        '',
      ].join('\n'),
    });
    errCtx.api.init({
      apiKey: VALID_KEY,
      assistantId: 'asst_smoke',
      apiBaseUrl: 'https://api.test',
    });
    await waitForAuth(errCtx.document, 'ready');
    errCtx.api.open();

    const shadow = errCtx.document.getElementById('genie-widget-root').shadowRoot;
    const form = shadow.getElementById('gw-form');
    shadow.getElementById('gw-input').value = 'Rate limited mid-stream';
    form.dispatchEvent(
      new shadow.ownerDocument.defaultView.Event('submit', { bubbles: true, cancelable: true }),
    );

    const start = Date.now();
    let status;
    while (Date.now() - start < 1000) {
      status = shadow.getElementById('gw-status');
      if (status && !status.hidden && /Too many requests/i.test(status.textContent)) break;
      await new Promise((r) => setTimeout(r, 10));
    }
    assert.ok(status && !status.hidden);
    assert.match(status.textContent, /Too many requests/i);
    assert.ok(!/bucket|retry-after/i.test(status.textContent));
    errCtx.api.destroy();
  });

  it('re-init replaces previous mount; destroy removes host', async () => {
    const { api, document } = ctx;
    api.init({ apiKey: VALID_KEY, assistantId: 'a1', apiBaseUrl: 'https://api.test' });
    api.init({
      apiKey: VALID_KEY_2,
      assistantId: 'a2',
      title: 'Second',
      apiBaseUrl: 'https://api.test',
    });
    await waitForAuth(document, 'ready');

    const hosts = document.querySelectorAll('#genie-widget-root');
    assert.equal(hosts.length, 1);
    assert.equal(hosts[0].shadowRoot.getElementById('gw-title').textContent, 'Second');

    api.destroy();
    assert.equal(document.getElementById('genie-widget-root'), null);
  });
});

describe('widget theme=auto media listeners', () => {
  it('follows prefers-color-scheme dark and cleans up on destroy', async () => {
    const { api, document, mediaListeners } = loadWidgetWithDom({ dark: true });
    api.init({
      apiKey: VALID_KEY,
      assistantId: 'a',
      theme: 'auto',
      apiBaseUrl: 'https://api.test',
    });
    await waitForAuth(document, 'ready');

    const root = document.getElementById('genie-widget-root').shadowRoot.querySelector('.gw-root');
    assert.equal(root.dataset.theme, 'dark');
    assert.ok(mediaListeners.length >= 1);

    mediaListeners.forEach((fn) => {
      fn();
    });

    api.destroy();
    assert.equal(mediaListeners.length, 0);
  });

  it('uses legacy addListener/removeListener when addEventListener is absent', async () => {
    const { api, document, mediaListeners } = loadWidgetWithDom({
      dark: false,
      legacyMedia: true,
    });
    api.init({
      apiKey: VALID_KEY,
      assistantId: 'a',
      theme: 'auto',
      apiBaseUrl: 'https://api.test',
    });
    await waitForAuth(document, 'ready');

    const root = document.getElementById('genie-widget-root').shadowRoot.querySelector('.gw-root');
    assert.equal(root.dataset.theme, 'light');
    assert.ok(mediaListeners.length >= 1);

    api.destroy();
    assert.equal(mediaListeners.length, 0);
  });
});
