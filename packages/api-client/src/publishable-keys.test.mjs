/**
 * Unit tests for publishable keys API client (Layer B campaign 5).
 */
import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'node:test';

const BASE = 'http://localhost:4000';
const TOKEN = 'test-jwt';
const ORG = 'org-abc-123';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GeniePublishableKeysClient', () => {
  /** @type {typeof fetch} */
  let originalFetch;
  /** @type {Array<{ url: string; init: RequestInit }>} */
  let calls;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    calls = [];
    globalThis.fetch = async (url, init = {}) => {
      calls.push({ url: String(url), init });
      return jsonResponse({ keys: [] });
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('createPublishableKeysClient defaults base URL to localhost:4000', async () => {
    const { createPublishableKeysClient } = await import('./publishable-keys.ts');
    const client = createPublishableKeysClient();
    assert.equal(client.getBaseUrl(), 'http://localhost:4000');
  });

  it('list GETs org public-keys with bearer token', async () => {
    globalThis.fetch = async (url, init = {}) => {
      calls.push({ url: String(url), init });
      return jsonResponse({
        keys: [{ id: 'k1', keyPrefix: 'pk_live_Ab…wxyz', name: 'Embed' }],
      });
    };

    const { createPublishableKeysClient } = await import('./publishable-keys.ts');
    const client = createPublishableKeysClient(BASE);
    const result = await client.list(TOKEN, ORG);

    assert.equal(calls.length, 1);
    assert.equal(
      calls[0].url,
      `${BASE}/api/v1/organizations/${ORG}/public-keys`,
    );
    assert.equal(calls[0].init.method, 'GET');
    assert.equal(calls[0].init.headers.Authorization, `Bearer ${TOKEN}`);
    assert.equal(result.keys.length, 1);
    assert.equal(result.keys[0].id, 'k1');
  });

  it('create POSTs with JSON body and bearer token', async () => {
    globalThis.fetch = async (url, init = {}) => {
      calls.push({ url: String(url), init });
      return jsonResponse(
        {
          id: 'k-new',
          key: 'pk_live_' + 'x'.repeat(43),
          keyPrefix: 'pk_live_xxx…xxxx',
          name: 'Website embed',
        },
        201,
      );
    };

    const { createPublishableKeysClient } = await import('./publishable-keys.ts');
    const client = createPublishableKeysClient(BASE);
    const created = await client.create(TOKEN, ORG, { name: 'Website embed' });

    assert.equal(calls.length, 1);
    assert.equal(
      calls[0].url,
      `${BASE}/api/v1/organizations/${ORG}/public-keys`,
    );
    assert.equal(calls[0].init.method, 'POST');
    assert.equal(calls[0].init.headers.Authorization, `Bearer ${TOKEN}`);
    assert.equal(calls[0].init.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(String(calls[0].init.body)), { name: 'Website embed' });
    assert.match(created.key, /^pk_live_/);
  });

  it('revoke POSTs to revoke endpoint', async () => {
    globalThis.fetch = async (url, init = {}) => {
      calls.push({ url: String(url), init });
      return jsonResponse({
        id: 'k1',
        keyPrefix: 'pk_live_Ab…wxyz',
        revokedAt: '2026-07-22T00:00:00.000Z',
      });
    };

    const { createPublishableKeysClient } = await import('./publishable-keys.ts');
    const client = createPublishableKeysClient(BASE);
    const revoked = await client.revoke(TOKEN, ORG, 'k1');

    assert.equal(calls.length, 1);
    assert.equal(
      calls[0].url,
      `${BASE}/api/v1/organizations/${ORG}/public-keys/k1/revoke`,
    );
    assert.equal(calls[0].init.method, 'POST');
    assert.equal(revoked.id, 'k1');
    assert.ok(revoked.revokedAt);
  });

  it('surfaces API error messages from JSON body', async () => {
    globalThis.fetch = async () =>
      jsonResponse({ message: 'Forbidden' }, 403);

    const { createPublishableKeysClient } = await import('./publishable-keys.ts');
    const client = createPublishableKeysClient(BASE);

    await assert.rejects(() => client.list(TOKEN, ORG), /Forbidden/);
  });

  it('surfaces network errors with helpful message', async () => {
    globalThis.fetch = async () => {
      throw new Error('ECONNREFUSED');
    };

    const { createPublishableKeysClient } = await import('./publishable-keys.ts');
    const client = createPublishableKeysClient(BASE);

    await assert.rejects(
      () => client.list(TOKEN, ORG),
      /Network error — could not reach the API/,
    );
  });
});
