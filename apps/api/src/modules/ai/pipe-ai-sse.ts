import { HttpException } from '@nestjs/common';
import type { Request, Response } from 'express';

export type SseEventLike = { event: string; data: unknown };

/**
 * Shared SSE plumbing for AI chat streams (member + public widget).
 *
 * - Wires AbortSignal to request `close`
 * - Peeks the first event so pre-stream failures stay normal HTTP JSON
 * - Sets SSE headers, writes events, maps mid-stream errors, cleans up
 * - Sets `Retry-After: 60` on HTTP 429 responses before headers are sent
 */
export async function pipeAiSse(
  res: Response,
  req: Request,
  createGenerator: (signal: AbortSignal) => AsyncGenerator<SseEventLike>,
): Promise<void> {
  const abortController = new AbortController();
  const onClose = () => abortController.abort();
  req.on('close', onClose);

  try {
    const generator = createGenerator(abortController.signal);
    const first = await generator.next();
    if (first.done) {
      // Client disconnect / abort before first event — do not invent an error body.
      if (abortController.signal.aborted || res.writableEnded) {
        return;
      }
      res.status(500).json({
        statusCode: 500,
        message: 'Empty AI stream',
        error: 'Internal Server Error',
      });
      return;
    }

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    writeSse(res, first.value.event, first.value.data);

    for await (const event of generator) {
      if (abortController.signal.aborted || res.writableEnded) {
        break;
      }
      writeSse(res, event.event, event.data);
    }
  } catch (error) {
    if (isAbortError(error) || abortController.signal.aborted) {
      return;
    }
    if (!res.headersSent) {
      writeHttpError(res, error);
      return;
    }
    if (!res.writableEnded) {
      writeSse(res, 'error', mapSseError(error));
    }
  } finally {
    req.off('close', onClose);
    if (!res.writableEnded) {
      res.end();
    }
  }
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof Error && error.name === 'AbortError') ||
    (typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name: string }).name === 'AbortError')
  );
}

function writeSse(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function writeHttpError(res: Response, error: unknown): void {
  if (error instanceof HttpException) {
    const status = error.getStatus();
    if (status === 429) {
      res.setHeader('Retry-After', '60');
    }
    const body = error.getResponse();
    res.status(status).json(
      typeof body === 'string'
        ? { statusCode: status, message: body, error: error.name }
        : body,
    );
    return;
  }

  res.status(500).json({
    statusCode: 500,
    message: 'Internal server error',
    error: 'Internal Server Error',
  });
}

function mapSseError(error: unknown): {
  statusCode: number;
  code: string;
  message: string;
} {
  if (error instanceof HttpException) {
    const status = error.getStatus();
    const body = error.getResponse();
    const code =
      typeof body === 'object' && body !== null && 'code' in body
        ? String((body as { code: unknown }).code)
        : status === 503
          ? 'AI_NOT_CONFIGURED'
          : 'AI_PROVIDER_ERROR';
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? String((body as { message: unknown }).message)
        : typeof body === 'string'
          ? body
          : 'Upstream model request failed';
    return { statusCode: status, code, message };
  }

  return {
    statusCode: 502,
    code: 'AI_PROVIDER_ERROR',
    message: 'Upstream model request failed',
  };
}
