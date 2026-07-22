/**
 * Layer A tests for the minified IIFE bundle (bubble + panel UI).
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
 * @returns {{
 *   api: { init: Function, destroy: Function, open: Function, close: Function, version: string },
 *   document: Document,
 *   window: Window & typeof globalThis,
 * }}
 */
function loadWidgetWithDom() {
  const { window, document } = parseHTML('<!doctype html><html><body></body></html>');
  // linkedom matchMedia stub for theme=auto
  window.matchMedia = (query) => ({
    matches: String(query).includes('dark') ? false : false,
    media: String(query),
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  });

  const code = fs.readFileSync(bundlePath, 'utf8');
  const sandbox = {
    console,
    window,
    document,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
  };
  // IIFE may assign to `this` / global — mirror window as globalThis-like
  Object.defineProperty(sandbox, 'globalThis', { value: sandbox });
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  const api = /** @type {{ init: Function, destroy: Function, open: Function, close: Function, version: string }} */ (
    sandbox.GenieWidget
  );
  return { api, document, window };
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
});

describe('widget bubble + panel UI', () => {
  /** @type {{ api: any, document: Document }} */
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

  it('appends user message and placeholder assistant reply on send', async () => {
    const { api, document } = ctx;
    api.init({ apiKey: 'key_smoke', assistantId: 'asst_smoke' });
    api.open();

    const shadow = document.getElementById('genie-widget-root').shadowRoot;
    const input = shadow.getElementById('gw-input');
    const form = shadow.getElementById('gw-form');

    input.value = 'Hello Genie';
    form.dispatchEvent(new shadow.ownerDocument.defaultView.Event('submit', { bubbles: true, cancelable: true }));

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

  it('renders title via textContent (no HTML injection)', () => {
    const { api, document } = ctx;
    const evil = '<img src=x onerror=alert(1)>';
    api.init({ apiKey: 'k', assistantId: 'a', title: evil });

    const title = document.getElementById('genie-widget-root').shadowRoot.getElementById('gw-title');
    assert.equal(title.textContent, evil);
    assert.equal(title.children.length, 0);
    assert.equal(title.querySelector('img'), null);
  });
});
