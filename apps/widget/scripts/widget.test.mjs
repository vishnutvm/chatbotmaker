/**
 * Layer A/B tests for the minified IIFE bundle (bubble + panel UI).
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

/**
 * @param {{ dark?: boolean, legacyMedia?: boolean }} [mediaOpts]
 * @returns {{
 *   api: { init: Function, destroy: Function, open: Function, close: Function, version: string },
 *   document: Document,
 *   window: Window & typeof globalThis,
 *   mediaListeners: Array<() => void>,
 * }}
 */
function loadWidgetWithDom(mediaOpts = {}) {
  const { window, document } = parseHTML('<!doctype html><html><body></body></html>');
  /** @type {Array<() => void>} */
  const mediaListeners = [];
  const dark = Boolean(mediaOpts.dark);
  const legacyMedia = Boolean(mediaOpts.legacyMedia);

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
      // Older Safari: only addListener/removeListener exist.
      delete mql.addEventListener;
      delete mql.removeEventListener;
    }
    return mql;
  };

  const code = fs.readFileSync(bundlePath, 'utf8');
  const sandbox = {
    console,
    window,
    document,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
  };
  Object.defineProperty(sandbox, 'globalThis', { value: sandbox });
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  const api = /** @type {{ init: Function, destroy: Function, open: Function, close: Function, version: string }} */ (
    sandbox.GenieWidget
  );
  return { api, document, window, mediaListeners };
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

  it('rejects missing or blank assistantId', () => {
    const { api } = loadWidgetWithDom();
    assert.throws(() => api.init({ apiKey: 'key_1' }), /assistantId is required/);
    assert.throws(() => api.init({ apiKey: 'key_1', assistantId: '' }), /assistantId is required/);
  });

  it('rejects non-object config', () => {
    const { api } = loadWidgetWithDom();
    assert.throws(() => api.init(null), /config object is required/);
    assert.throws(() => api.init('x'), /config object is required/);
  });

  it('rejects invalid theme', () => {
    const { api } = loadWidgetWithDom();
    assert.throws(
      () => api.init({ apiKey: 'k', assistantId: 'a', theme: 'neon' }),
      /theme must be/,
    );
  });

  it('rejects non-string title', () => {
    const { api } = loadWidgetWithDom();
    assert.throws(
      () => api.init({ apiKey: 'k', assistantId: 'a', title: 42 }),
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
  /** @type {{ api: any, document: Document, window: any, mediaListeners: Array<() => void> }} */
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

  it('mounts a Shadow DOM host with bubble and panel', () => {
    const { api, document } = ctx;
    api.init({ apiKey: 'key_smoke', assistantId: 'asst_smoke', theme: 'light' });

    const host = document.getElementById('genie-widget-root');
    assert.ok(host);
    assert.ok(host.shadowRoot);

    const bubble = host.shadowRoot.getElementById('gw-bubble');
    const panel = host.shadowRoot.getElementById('gw-panel');
    assert.ok(bubble);
    assert.ok(panel);
    assert.equal(panel.hasAttribute('hidden'), true);
    assert.equal(bubble.getAttribute('aria-expanded'), 'false');
  });

  it('toggles panel open/close via bubble and API', () => {
    const { api, document } = ctx;
    api.init({ apiKey: 'key_smoke', assistantId: 'asst_smoke', theme: 'dark', title: 'Support' });

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

  it('closes via header button and Escape key', () => {
    const { api, document } = ctx;
    api.init({ apiKey: 'key_smoke', assistantId: 'asst_smoke' });
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

  it('ignores empty composer submits', () => {
    const { api, document } = ctx;
    api.init({ apiKey: 'key_smoke', assistantId: 'asst_smoke' });
    api.open();

    const shadow = document.getElementById('genie-widget-root').shadowRoot;
    const form = shadow.getElementById('gw-form');
    const input = shadow.getElementById('gw-input');

    input.value = '   ';
    form.dispatchEvent(
      new shadow.ownerDocument.defaultView.Event('submit', { bubbles: true, cancelable: true }),
    );

    assert.equal(shadow.querySelectorAll('.gw-msg').length, 0);
    assert.ok(shadow.getElementById('gw-empty'));
  });

  it('sets title via textContent (no HTML injection)', () => {
    const { api, document } = ctx;
    api.init({
      apiKey: 'key_smoke',
      assistantId: 'asst_smoke',
      title: '<img src=x onerror=alert(1)>',
    });

    const title = document.getElementById('genie-widget-root').shadowRoot.getElementById('gw-title');
    assert.equal(title.textContent, '<img src=x onerror=alert(1)>');
    assert.equal(title.querySelectorAll('img').length, 0);
  });

  it('defaults blank title to Chat and resolves theme=auto to light', () => {
    const { api, document } = ctx;
    api.init({ apiKey: 'key_smoke', assistantId: 'asst_smoke', theme: 'auto', title: '   ' });

    const shadow = document.getElementById('genie-widget-root').shadowRoot;
    assert.equal(shadow.getElementById('gw-title').textContent, 'Chat');
    assert.equal(shadow.querySelector('.gw-root').dataset.theme, 'light');
  });

  it('appends user message and placeholder assistant reply on send', async () => {
    const { api, document } = ctx;
    api.init({ apiKey: 'key_smoke', assistantId: 'asst_smoke' });
    api.open();

    const shadow = document.getElementById('genie-widget-root').shadowRoot;
    const input = shadow.getElementById('gw-input');
    const form = shadow.getElementById('gw-form');

    input.value = 'Hello Genie';
    form.dispatchEvent(
      new shadow.ownerDocument.defaultView.Event('submit', { bubbles: true, cancelable: true }),
    );

    const userMsgs = shadow.querySelectorAll('.gw-msg[data-role="user"]');
    assert.equal(userMsgs.length, 1);
    assert.equal(userMsgs[0].textContent, 'Hello Genie');

    await new Promise((r) => setTimeout(r, 300));
    const botMsgs = shadow.querySelectorAll('.gw-msg[data-role="assistant"]');
    assert.equal(botMsgs.length, 1);
    assert.match(botMsgs[0].textContent, /Phase 7/);
  });

  it('re-init replaces previous mount; destroy removes host', () => {
    const { api, document } = ctx;
    api.init({ apiKey: 'k1', assistantId: 'a1' });
    api.init({ apiKey: 'k2', assistantId: 'a2', title: 'Second' });

    const hosts = document.querySelectorAll('#genie-widget-root');
    assert.equal(hosts.length, 1);
    assert.equal(hosts[0].shadowRoot.getElementById('gw-title').textContent, 'Second');

    api.destroy();
    assert.equal(document.getElementById('genie-widget-root'), null);
  });
});

describe('widget theme=auto media listeners', () => {
  it('follows prefers-color-scheme dark and cleans up on destroy', () => {
    const { api, document, mediaListeners } = loadWidgetWithDom({ dark: true });
    api.init({ apiKey: 'k', assistantId: 'a', theme: 'auto' });

    const root = document.getElementById('genie-widget-root').shadowRoot.querySelector('.gw-root');
    assert.equal(root.dataset.theme, 'dark');
    assert.ok(mediaListeners.length >= 1);

    mediaListeners.forEach((fn) => {
      fn();
    });

    api.destroy();
    assert.equal(mediaListeners.length, 0);
  });

  it('uses legacy addListener/removeListener when addEventListener is absent', () => {
    const { api, document, mediaListeners } = loadWidgetWithDom({ dark: false, legacyMedia: true });
    api.init({ apiKey: 'k', assistantId: 'a', theme: 'auto' });

    const root = document.getElementById('genie-widget-root').shadowRoot.querySelector('.gw-root');
    assert.equal(root.dataset.theme, 'light');
    assert.ok(mediaListeners.length >= 1);

    api.destroy();
    assert.equal(mediaListeners.length, 0);
  });
});
