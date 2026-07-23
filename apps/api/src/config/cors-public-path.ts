import type { Request } from 'express';

/** Pathname-only public API check — never match on query strings. */
export function isPublicApiPath(req: Pick<Request, 'path' | 'originalUrl' | 'url'>): boolean {
  const raw = req.path || req.originalUrl || req.url || '';
  const pathname = raw.split('?')[0] || '';
  if (pathname === '/api/v1/public' || pathname.startsWith('/api/v1/public/')) {
    return true;
  }
  // Stripe webhooks (no browser Origin; keep CORS permissive if a proxy adds one).
  return pathname === '/api/v1/webhooks/stripe';
}
