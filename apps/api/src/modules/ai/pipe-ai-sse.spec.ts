import { HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { pipeAiSse } from './pipe-ai-sse';

function mockReqRes() {
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
  } as unknown as Request;

  const res = {
    status: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    write: jest.fn(),
    end: jest.fn(),
    flushHeaders: jest.fn(),
    headersSent: false,
    writableEnded: false,
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
    expect(res.setHeader).not.toHaveBeenCalledWith('Content-Type', 'text/event-stream');
  });
});
