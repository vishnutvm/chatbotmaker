import type { Request } from 'express';

/** Pathname-only public API check — never match on query strings. */
export function isPublicApiPath(req: Pick<Request, 'path' | 'originalUrl' | 'url'>): boolean {
  const raw = req.path || req.originalUrl || req.url || '';
  const pathname = raw.split('?')[0] || '';
  return pathname === '/api/v1/public' || pathname.startsWith('/api/v1/public/');
}
