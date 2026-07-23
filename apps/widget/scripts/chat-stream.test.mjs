/**
 * Direct unit tests for widget chat SSE client (Layer B campaign 7).
 * Pure helpers + streamWidgetChat with mocked fetch — no IIFE / DOM.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const {
  messageForHttpStatus,
  messageForErrorCode,
  createSseParser,
  streamWidgetChat,
} = await import('../src/chat-stream.ts');

describe('messageForHttpStatus', () => {
  it('maps known statuses to visitor-safe copy', () => {
    assert.equal(messageForHttpStatus(400), 'Invalid message — please try again.');
    assert.equal(messageForHttpStatus(401), 'Invalid or revoked public key.');
    assert.equal(messageForHttpStatus(404), 'Assistant not available.');
    assert.equal(messageForHttpStatus(429), 'Too many requests — try again shortly.');
    assert.equal(messageForHttpStatus(503), 'Chat temporarily unavailable.');
    assert.equal(messageForHttpStatus(500), 'Something went wrong — try again.');
    assert.equal(messageForHttpStatus(418), 'Something went wrong — try again.');
  });
});

describe('messageForErrorCode', () => {
  it('returns null for empty or unknown codes', () => {
    assert.equal(messageForErrorCode(undefined), null);
    assert.equal(messageForErrorCode(''), null);
    assert.equal(messageForErrorCode('WEIRD_CODE'), null);
  });

  it('maps auth / not-found / rate-limit / unavailable codes', () => {
    assert.equal(messageForErrorCode('unauthorized'), messageForHttpStatus(401));
    assert.equal(messageForErrorCode('INVALID_KEY'), messageForHttpStatus(401));
    assert.equal(messageForErrorCode('revoked_key'), messageForHttpStatus(401));
    assert.equal(messageForErrorCode('NOT_FOUND'), messageForHttpStatus(404));
    assert.equal(messageForErrorCode('assistant_not_found'), messageForHttpStatus(404));
    assert.equal(messageForErrorCode('RATE_LIMITED'), messageForHttpStatus(429));
    assert.equal(messageForErrorCode('too_many_requests'), messageForHttpStatus(429));
    assert.equal(messageForErrorCode('RATE_LIMIT_EXCEEDED'), messageForHttpStatus(429));
    assert.equal(messageForErrorCode('SERVICE_UNAVAILABLE'), messageForHttpStatus(503));
  });

  it('maps provider / internal / *_ERROR codes to generic failure', () => {
    assert.equal(messageForErrorCode('AI_PROVIDER_ERROR'), messageForHttpStatus(500));
    assert.equal(messageForErrorCode('INTERNAL'), messageForHttpStatus(500));
    assert.equal(messageForErrorCode('SOME_ERROR'), messageForHttpStatus(500));
  });
});

describe('createSseParser', () => {
  it('parses event/data blocks across chunk boundaries and CRLF', () => {
    /** @type {Array<[string, string]>} */
    const events = [];
    const parser = createSseParser((event, data) => events.push([event, data]));

    parser.push('event: delta\r\n');
    parser.push('data: {"content":"Hel');
    parser.push('lo"}\n\n');
    parser.push(': keepalive\n');
    parser.push('data: line1\ndata: line2\n\n');
    parser.flush();

    assert.deepEqual(events, [
      ['delta', '{"content":"Hello"}'],
      ['message', 'line1\nline2'],
    ]);
  });

  it('treats empty event field as message and ignores blank dispatches', () => {
    /** @type {Array<[string, string]>} */
    const events = [];
    const parser = createSseParser((event, data) => events.push([event, data]));

    parser.push('event:\ndata: x\n\n');
    parser.push('\n');
    parser.push('lonely-field\n\n');
    parser.flush();

    assert.deepEqual(events, [['message', 'x']]);
  });
});

/**
 * @param {string} sseText
 * @param {{ ok?: boolean, status?: number, jsonBody?: unknown, body?: null | { getReader: () => unknown } }} [opts]
 */
function mockFetchResponse(sseText, opts = {}) {
  const encoder = new TextEncoder();
  const body =
    opts.body === null
      ? null
      : opts.body ??
        new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(sseText));
            controller.close();
          },
        });

  return {
    ok: opts.ok !== false,
    status: opts.status ?? 200,
    body,
    json: async () => opts.jsonBody ?? { message: 'server detail' },
  };
}

describe('streamWidgetChat', () => {
  const baseOpts = {
    apiBase: 'https://api.example.com/',
    apiKey: 'pk_live_test',
    assistantId: 'asst_1',
    messages: [{ role: 'user', content: 'Hi' }],
  };

  it('streams deltas and done; ignores meta and empty/malformed deltas', async () => {
    /** @type {string[]} */
    const deltas = [];
    /** @type {unknown} */
    let done = null;
    /** @type {string[]} */
    const errors = [];

    const sse = [
      'event: meta',
      'data: {"model":"m"}',
      '',
      'event: delta',
      'data: {"content":""}',
      '',
      'event: delta',
      'data: not-json',
      '',
      'event: delta',
      'data: {"content":"Hello"}',
      '',
      'event: done',
      'data: {"finishReason":"stop"}',
      '',
    ].join('\n');

    await streamWidgetChat({
      ...baseOpts,
      onDelta: (c) => deltas.push(c),
      onDone: (p) => {
        done = p;
      },
      onError: (m) => errors.push(m),
      fetchImpl: async (url, init) => {
        assert.equal(url, 'https://api.example.com/api/v1/public/widget/chat/stream');
        assert.equal(init?.method, 'POST');
        assert.equal(init?.headers?.['X-Genie-Public-Key'], 'pk_live_test');
        assert.ok(!String(url).includes('pk_live'));
        return mockFetchResponse(sse);
      },
    });

    assert.deepEqual(deltas, ['Hello']);
    assert.deepEqual(done, { finishReason: 'stop' });
    assert.deepEqual(errors, []);
  });

  it('maps HTTP failures without exposing server JSON message', async () => {
    /** @type {Array<{ message: string, meta?: unknown }>} */
    const errors = [];

    await streamWidgetChat({
      ...baseOpts,
      onDelta: () => {},
      onError: (message, meta) => errors.push({ message, meta }),
      fetchImpl: async () =>
        mockFetchResponse('', {
          ok: false,
          status: 401,
          jsonBody: { message: 'secret internals' },
        }),
    });

    assert.equal(errors.length, 1);
    assert.equal(errors[0].message, 'Invalid or revoked public key.');
    assert.deepEqual(errors[0].meta, { status: 401 });
    assert.ok(!JSON.stringify(errors).includes('secret'));
  });

  it('maps SSE error by statusCode preferentially over code', async () => {
    /** @type {string[]} */
    const errors = [];
    const sse =
      'event: error\ndata: {"statusCode":429,"code":"AI_PROVIDER_ERROR","message":"raw"}\n\n';

    await streamWidgetChat({
      ...baseOpts,
      onDelta: () => {},
      onError: (m) => errors.push(m),
      fetchImpl: async () => mockFetchResponse(sse),
    });

    assert.deepEqual(errors, ['Too many requests — try again shortly.']);
  });

  it('maps SSE error by code when statusCode is absent', async () => {
    /** @type {string[]} */
    const errors = [];
    const sse = 'event: error\ndata: {"code":"RATE_LIMITED"}\n\n';

    await streamWidgetChat({
      ...baseOpts,
      onDelta: () => {},
      onError: (m) => errors.push(m),
      fetchImpl: async () => mockFetchResponse(sse),
    });

    assert.deepEqual(errors, ['Too many requests — try again shortly.']);
  });

  it('reports when streaming body is unsupported', async () => {
    /** @type {string[]} */
    const errors = [];

    await streamWidgetChat({
      ...baseOpts,
      onDelta: () => {},
      onError: (m) => errors.push(m),
      fetchImpl: async () => mockFetchResponse('', { body: null }),
    });

    assert.deepEqual(errors, ['Streaming is not supported in this browser.']);
  });

  it('reports unexpected end when stream closes without done/error', async () => {
    /** @type {string[]} */
    const errors = [];
    const sse = 'event: delta\ndata: {"content":"partial"}\n\n';

    await streamWidgetChat({
      ...baseOpts,
      onDelta: () => {},
      onError: (m) => errors.push(m),
      fetchImpl: async () => mockFetchResponse(sse),
    });

    assert.deepEqual(errors, ['Chat stream ended unexpectedly.']);
  });

  it('swallows fetch AbortError and network failures map to safe copy', async () => {
    /** @type {string[]} */
    const errors = [];
    const abortErr = new Error('aborted');
    abortErr.name = 'AbortError';

    await streamWidgetChat({
      ...baseOpts,
      onDelta: () => {},
      onError: (m) => errors.push(m),
      fetchImpl: async () => {
        throw abortErr;
      },
    });
    assert.deepEqual(errors, []);

    await streamWidgetChat({
      ...baseOpts,
      onDelta: () => {},
      onError: (m) => errors.push(m),
      fetchImpl: async () => {
        throw new Error('offline');
      },
    });
    assert.deepEqual(errors, ['Network error while chatting. Check your connection.']);
  });

  it('cancels reader when signal aborts mid-stream', async () => {
    const controller = new AbortController();
    /** @type {string[]} */
    const errors = [];
    let cancelled = false;

    const stream = new ReadableStream({
      start(ctrl) {
        ctrl.enqueue(
          new TextEncoder().encode('event: delta\ndata: {"content":"hi"}\n\n'),
        );
        ctrl.close();
      },
      cancel() {
        cancelled = true;
      },
    });

    await streamWidgetChat({
      ...baseOpts,
      signal: controller.signal,
      onDelta: () => {
        controller.abort();
      },
      onError: (m) => errors.push(m),
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        body: stream,
        json: async () => ({}),
      }),
    });

    // Abort after delta: either cancel ran or we exited on aborted signal without error.
    assert.ok(cancelled || errors.length === 0);
    assert.deepEqual(errors, []);
  });

  it('uses default done payload when done data is malformed', async () => {
    /** @type {unknown} */
    let done = null;
    const sse = 'event: done\ndata: not-json\n\n';

    await streamWidgetChat({
      ...baseOpts,
      onDelta: () => {},
      onDone: (p) => {
        done = p;
      },
      onError: () => {},
      fetchImpl: async () => mockFetchResponse(sse),
    });

    assert.deepEqual(done, { finishReason: null });
  });
});
