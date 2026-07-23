import type { WidgetChatMessage, WidgetChatStreamDone } from './types';

export interface StreamWidgetChatOptions {
  apiBase: string;
  apiKey: string;
  assistantId: string;
  messages: WidgetChatMessage[];
  signal?: AbortSignal;
  onDelta: (content: string) => void;
  onDone?: (payload: WidgetChatStreamDone) => void;
  onError: (message: string, meta?: { status?: number; code?: string }) => void;
  /** Optional fetch override (tests). */
  fetchImpl?: typeof fetch;
}

/**
 * Maps pre-stream HTTP failures to visitor-safe messages.
 * Never include the publishable key.
 */
export function messageForHttpStatus(status: number): string {
  if (status === 400) return 'Invalid message — please try again.';
  if (status === 401) return 'Invalid or revoked public key.';
  if (status === 404) return 'Assistant not available.';
  if (status === 429) return 'Too many requests — try again shortly.';
  if (status === 503) return 'Chat temporarily unavailable.';
  if (status >= 500) return 'Something went wrong — try again.';
  return `Request failed (${status}).`;
}

/**
 * Maps SSE error `code` to the same visitor-safe strings as HTTP status
 * when `statusCode` is absent. Returns null when the code is unknown.
 */
export function messageForErrorCode(code: string | undefined): string | null {
  if (!code) return null;
  const normalized = code.trim().toUpperCase();
  if (
    normalized === 'UNAUTHORIZED' ||
    normalized === 'INVALID_KEY' ||
    normalized === 'REVOKED_KEY'
  ) {
    return messageForHttpStatus(401);
  }
  if (normalized === 'NOT_FOUND' || normalized === 'ASSISTANT_NOT_FOUND') {
    return messageForHttpStatus(404);
  }
  if (
    normalized === 'RATE_LIMITED' ||
    normalized === 'TOO_MANY_REQUESTS' ||
    normalized === 'RATE_LIMIT_EXCEEDED'
  ) {
    return messageForHttpStatus(429);
  }
  if (normalized === 'SERVICE_UNAVAILABLE') {
    return messageForHttpStatus(503);
  }
  if (
    normalized.endsWith('_ERROR') ||
    normalized.includes('PROVIDER') ||
    normalized.includes('INTERNAL')
  ) {
    return messageForHttpStatus(500);
  }
  return null;
}

function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const name = 'name' in err ? String((err as { name?: unknown }).name) : '';
  return name === 'AbortError';
}

/**
 * Incremental SSE line parser (event: / data: fields).
 * Dispatches one event when a blank line is seen.
 */
export function createSseParser(onEvent: (event: string, data: string) => void): {
  push: (chunk: string) => void;
  flush: () => void;
} {
  let buffer = '';
  let eventName = 'message';
  const dataLines: string[] = [];

  function dispatch(): void {
    if (dataLines.length === 0) {
      eventName = 'message';
      return;
    }
    const data = dataLines.join('\n');
    dataLines.length = 0;
    const name = eventName;
    eventName = 'message';
    onEvent(name, data);
  }

  function handleLine(raw: string): void {
    const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
    if (line === '') {
      dispatch();
      return;
    }
    if (line.startsWith(':')) return;
    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);

    if (field === 'event') {
      eventName = value || 'message';
    } else if (field === 'data') {
      dataLines.push(value);
    }
  }

  return {
    push(chunk: string) {
      buffer += chunk;
      let newline: number;
      while ((newline = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        handleLine(line);
      }
    },
    flush() {
      if (buffer.length > 0) {
        handleLine(buffer);
        buffer = '';
      }
      dispatch();
    },
  };
}

/**
 * POST /api/v1/public/widget/chat/stream — fetch + SSE (EventSource cannot POST).
 * Sends X-Genie-Public-Key header only (never query).
 */
export async function streamWidgetChat(options: StreamWidgetChatOptions): Promise<void> {
  const fetchFn = options.fetchImpl ?? fetch;
  const base = options.apiBase.replace(/\/$/, '');
  const url = `${base}/api/v1/public/widget/chat/stream`;

  let response: Response;
  try {
    response = await fetchFn(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        'X-Genie-Public-Key': options.apiKey,
      },
      body: JSON.stringify({
        assistantId: options.assistantId,
        messages: options.messages,
      }),
      signal: options.signal,
    });
  } catch (err) {
    if (isAbortError(err) || options.signal?.aborted) return;
    options.onError('Network error while chatting. Check your connection.');
    return;
  }

  if (options.signal?.aborted) return;

  if (!response.ok) {
    const message = messageForHttpStatus(response.status);
    // Drain JSON body when present (ignore contents for visitor-facing copy).
    try {
      await response.json();
    } catch {
      /* ignore non-JSON error bodies */
    }
    options.onError(message, { status: response.status });
    return;
  }

  const body = response.body;
  if (!body || typeof body.getReader !== 'function') {
    options.onError('Streaming is not supported in this browser.');
    return;
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let sawDone = false;
  let streamFailed = false;

  const parser = createSseParser((event, data) => {
    if (streamFailed || sawDone) return;

    if (event === 'delta') {
      try {
        const parsed = JSON.parse(data) as { content?: unknown };
        if (typeof parsed.content === 'string' && parsed.content.length > 0) {
          options.onDelta(parsed.content);
        }
      } catch {
        /* ignore malformed delta */
      }
      return;
    }

    if (event === 'done') {
      sawDone = true;
      let payload: WidgetChatStreamDone = { finishReason: null };
      try {
        const parsed = JSON.parse(data) as WidgetChatStreamDone;
        payload = parsed;
      } catch {
        /* use default */
      }
      options.onDone?.(payload);
      return;
    }

    if (event === 'error') {
      streamFailed = true;
      let status: number | undefined;
      let code: string | undefined;
      try {
        const parsed = JSON.parse(data) as {
          statusCode?: unknown;
          code?: unknown;
        };
        // Never surface raw server `message` to visitors — map status/code only.
        if (typeof parsed.statusCode === 'number') status = parsed.statusCode;
        if (typeof parsed.code === 'string') code = parsed.code;
      } catch {
        /* keep defaults */
      }
      const message =
        typeof status === 'number'
          ? messageForHttpStatus(status)
          : messageForErrorCode(code) ?? 'Something went wrong — try again.';
      options.onError(message, { status, code });
    }
    // meta and unknown events ignored
  });

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (options.signal?.aborted) {
        try {
          await reader.cancel();
        } catch {
          /* ignore */
        }
        return;
      }
      parser.push(decoder.decode(value, { stream: true }));
      if (streamFailed || sawDone) break;
    }
    parser.push(decoder.decode());
    parser.flush();
  } catch (err) {
    if (isAbortError(err) || options.signal?.aborted) return;
    if (!streamFailed && !sawDone) {
      options.onError('Connection lost while receiving the reply.');
    }
    return;
  }

  if (options.signal?.aborted || streamFailed || sawDone) return;
  options.onError('Chat stream ended unexpectedly.');
}
