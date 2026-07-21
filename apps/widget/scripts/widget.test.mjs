/**
 * Layer A tests for the minified IIFE bundle (no Next/dashboard deps).
 * Run after `pnpm build` — invoked by package.json `test` script.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, before } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundlePath = path.join(root, 'dist', 'widget.js');

/** @returns {{ init: Function, version: string }} */
function loadWidget() {
  const code = fs.readFileSync(bundlePath, 'utf8');
  const sandbox = { console, window: {} };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return /** @type {{ init: Function, version: string }} */ (sandbox.GenieWidget);
}

describe('widget.js IIFE bundle', () => {
  /** @type {string} */
  let code;
  /** @type {{ init: Function, version: string }} */
  let api;

  before(() => {
    assert.ok(fs.existsSync(bundlePath), `Missing ${bundlePath} — run pnpm build first`);
    code = fs.readFileSync(bundlePath, 'utf8');
    api = loadWidget();
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

  it('exposes GenieWidget.init and version on the global', () => {
    assert.equal(typeof api.init, 'function');
    assert.match(api.version, /^\d+\.\d+\.\d+$/);
  });

  it('rejects missing or blank apiKey', () => {
    assert.throws(() => api.init({ assistantId: 'asst_1' }), /apiKey is required/);
    assert.throws(() => api.init({ apiKey: '  ', assistantId: 'asst_1' }), /apiKey is required/);
  });

  it('rejects missing or blank assistantId', () => {
    assert.throws(() => api.init({ apiKey: 'key_1' }), /assistantId is required/);
    assert.throws(() => api.init({ apiKey: 'key_1', assistantId: '' }), /assistantId is required/);
  });

  it('rejects non-object config', () => {
    assert.throws(() => api.init(null), /config object is required/);
    assert.throws(() => api.init('x'), /config object is required/);
  });

  it('accepts valid init without throwing', () => {
    assert.doesNotThrow(() =>
      api.init({ apiKey: 'key_smoke', assistantId: 'asst_smoke' }),
    );
  });
});
