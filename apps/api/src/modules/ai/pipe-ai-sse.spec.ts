import { HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { pipeAiSse } from './pipe-ai-sse';

function mockReqRes(overrides?: {
  headersSent?: boolean;
  writableEnded?: boolean;
  flushHeaders?: false;
}) {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  const req = {
    on: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(handler);
      return req;
    }),
    off: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
      listeners.get(event)?.delete(handler);
      return req;
    }),
    emitClose() {
      for (const handler of listeners.get('close') ?? []) {
        handler();
      }
    },
  } as unknown as Request & { emitClose: () => void };

  const res = {
    status: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    write: jest.fn(),
    end: jest.fn(),
    flushHeaders:
      overrides?.flushHeaders === false ? undefined : jest.fn(),
    headersSent: overrides?.headersSent ?? false,
    writableEnded: overrides?.writableEnded ?? false,
  } as unknown as Response;

  return { req, res };
}

describe('pipeAiSse', () => {
  it('writes SSE events after peeking the first', async () => {
    const { req, res } = mockReqRes();

    await pipeAiSse(res, req, async function* () {
      yield { event: 'meta', data: { model: 'gpt-4o-mini' } };
      yield { event: 'delta', data: { content: 'Hi' } };
    });

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
    expect(res.write).toHaveBeenCalledWith(
      'event: meta\ndata: {"model":"gpt-4o-mini"}\n\n',
    );
    expect(res.write).toHaveBeenCalledWith('event: delta\ndata: {"content":"Hi"}\n\n');
    expect(res.end).toHaveBeenCalled();
    expect(req.off).toHaveBeenCalledWith('close', expect.any(Function));
  });

  it('works when flushHeaders is absent', async () => {
    const { req, res } = mockReqRes({ flushHeaders: false });

    await pipeAiSse(res, req, async function* () {
      yield { event: 'delta', data: { content: 'x' } };
    });

    expect(res.write).toHaveBeenCalled();
    expect(res.end).toHaveBeenCalled();
  });

  it('sets Retry-After on HTTP 429 before SSE headers', async () => {
    const { req, res } = mockReqRes();

    await pipeAiSse(res, req, async function* () {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded for public key chat',
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
      yield undefined as never;
    });

    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', '60');
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalled();
    expect(res.write).not.toHaveBeenCalled();
  });

  it('returns JSON 404 without SSE when generator throws before first yield', async () => {
    const { req, res } = mockReqRes();

    await pipeAiSse(res, req, async function* () {
      throw new HttpException('Assistant not found', HttpStatus.NOT_FOUND);
      yield undefined as never;
    });

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: 404,
      message: 'Assistant not found',
      error: 'HttpException',
    });
    expect(res.setHeader).not.toHaveBeenCalledWith('Content-Type', 'text/event-stream');
  });

  it('maps non-HttpException pre-stream failures to 500 JSON', async () => {
    const { req, res } = mockReqRes();

    await pipeAiSse(res, req, async function* () {
      throw new Error('boom');
      yield undefined as never;
    });

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
  });

  it('returns 500 Empty AI stream when generator completes with no events', async () => {
    const { req, res } = mockReqRes();

    await pipeAiSse(res, req, async function* () {
      // empty
    });

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Empty AI stream',
      error: 'Internal Server Error',
    });
    expect(res.write).not.toHaveBeenCalled();
  });

  it('does not invent an error body when client disconnects before first event', async () => {
    const { req, res } = mockReqRes();

    await pipeAiSse(res, req, async function* (signal) {
      req.emitClose();
      expect(signal.aborted).toBe(true);
      // empty after abort
    });

    expect(res.json).not.toHaveBeenCalled();
    expect(res.write).not.toHaveBeenCalled();
  });

  it('does not invent an error body when response already ended before first event', async () => {
    const { req, res } = mockReqRes({ writableEnded: true });

    await pipeAiSse(res, req, async function* () {
      // empty
    });

    expect(res.json).not.toHaveBeenCalled();
    expect(res.end).not.toHaveBeenCalled();
  });

  it('stops writing when client aborts mid-stream', async () => {
    const { req, res } = mockReqRes();

    await pipeAiSse(res, req, async function* () {
      yield { event: 'meta', data: { model: 'm' } };
      req.emitClose();
      yield { event: 'delta', data: { content: 'should-not-write' } };
    });

    expect(res.write).toHaveBeenCalledTimes(1);
    expect(res.write).toHaveBeenCalledWith('event: meta\ndata: {"model":"m"}\n\n');
  });

  it('stops writing when response ends mid-stream', async () => {
    const { req, res } = mockReqRes();

    await pipeAiSse(res, req, async function* () {
      yield { event: 'meta', data: { model: 'm' } };
      (res as { writableEnded: boolean }).writableEnded = true;
      yield { event: 'delta', data: { content: 'nope' } };
    });

    expect(res.write).toHaveBeenCalledTimes(1);
  });

  it('swallows AbortError without writing an error body', async () => {
    const { req, res } = mockReqRes();
    const abortErr = new Error('aborted');
    abortErr.name = 'AbortError';

    await pipeAiSse(res, req, async function* () {
      throw abortErr;
      yield undefined as never;
    });

    expect(res.json).not.toHaveBeenCalled();
    expect(res.write).not.toHaveBeenCalled();
  });

  it('swallows abort-shaped objects and aborted signal mid-stream', async () => {
    const { req, res } = mockReqRes();

    await pipeAiSse(res, req, async function* () {
      yield { event: 'meta', data: { model: 'm' } };
      (res as { headersSent: boolean }).headersSent = true;
      req.emitClose();
      throw { name: 'AbortError' };
    });

    expect(res.write).toHaveBeenCalledTimes(1);
    expect(res.write).not.toHaveBeenCalledWith(
      expect.stringContaining('event: error'),
    );
  });

  it('emits SSE error event for HttpException after headers are sent', async () => {
    const { req, res } = mockReqRes();

    await pipeAiSse(res, req, async function* () {
      yield { event: 'meta', data: { model: 'm' } };
      (res as { headersSent: boolean }).headersSent = true;
      throw new HttpException(
        {
          statusCode: 503,
          message: 'AI not configured',
          code: 'AI_NOT_CONFIGURED',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    });

    expect(res.write).toHaveBeenCalledWith(
      'event: error\ndata: {"statusCode":503,"code":"AI_NOT_CONFIGURED","message":"AI not configured"}\n\n',
    );
  });

  it('maps mid-stream 503 without code to AI_NOT_CONFIGURED', async () => {
    const { req, res } = mockReqRes();

    await pipeAiSse(res, req, async function* () {
      yield { event: 'delta', data: { content: 'partial' } };
      (res as { headersSent: boolean }).headersSent = true;
      throw new HttpException(
        { statusCode: 503, message: 'unavailable' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    });

    expect(res.write).toHaveBeenCalledWith(
      expect.stringContaining('"code":"AI_NOT_CONFIGURED"'),
    );
  });

  it('maps mid-stream string HttpException body', async () => {
    const { req, res } = mockReqRes();

    await pipeAiSse(res, req, async function* () {
      yield { event: 'delta', data: { content: 'x' } };
      (res as { headersSent: boolean }).headersSent = true;
      throw new HttpException('Upstream failed', HttpStatus.BAD_GATEWAY);
    });

    expect(res.write).toHaveBeenCalledWith(
      'event: error\ndata: {"statusCode":502,"code":"AI_PROVIDER_ERROR","message":"Upstream failed"}\n\n',
    );
  });

  it('maps mid-stream HttpException object without message to default copy', async () => {
    const { req, res } = mockReqRes();

    await pipeAiSse(res, req, async function* () {
      yield { event: 'delta', data: { content: 'x' } };
      (res as { headersSent: boolean }).headersSent = true;
      throw new HttpException({ statusCode: 502 }, HttpStatus.BAD_GATEWAY);
    });

    expect(res.write).toHaveBeenCalledWith(
      'event: error\ndata: {"statusCode":502,"code":"AI_PROVIDER_ERROR","message":"Upstream model request failed"}\n\n',
    );
  });

  it('maps mid-stream non-HttpException to generic provider SSE error', async () => {
    const { req, res } = mockReqRes();

    await pipeAiSse(res, req, async function* () {
      yield { event: 'delta', data: { content: 'x' } };
      (res as { headersSent: boolean }).headersSent = true;
      throw new Error('socket reset');
    });

    expect(res.write).toHaveBeenCalledWith(
      'event: error\ndata: {"statusCode":502,"code":"AI_PROVIDER_ERROR","message":"Upstream model request failed"}\n\n',
    );
  });

  it('skips SSE error write when response already ended after headers', async () => {
    const { req, res } = mockReqRes();

    await pipeAiSse(res, req, async function* () {
      yield { event: 'delta', data: { content: 'x' } };
      (res as { headersSent: boolean }).headersSent = true;
      (res as { writableEnded: boolean }).writableEnded = true;
      throw new Error('late failure');
    });

    expect(res.write).toHaveBeenCalledTimes(1);
    expect(res.write).not.toHaveBeenCalledWith(expect.stringContaining('event: error'));
  });
});
