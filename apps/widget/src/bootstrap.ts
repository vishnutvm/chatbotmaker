import type { WidgetBootstrapResult } from './types';

export class BootstrapError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'BootstrapError';
    this.status = status;
  }
}

/**
 * Calls GET /api/v1/public/widget/bootstrap with the publishable key header.
 * Never puts the key in the URL.
 */
export async function fetchWidgetBootstrap(options: {
  apiBaseUrl: string;
  apiKey: string;
  assistantId: string;
  fetchImpl?: typeof fetch;
}): Promise<WidgetBootstrapResult> {
  const fetchFn = options.fetchImpl ?? fetch;
  const url = `${options.apiBaseUrl}/api/v1/public/widget/bootstrap?assistantId=${encodeURIComponent(options.assistantId)}`;

  let response: Response;
  try {
    response = await fetchFn(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Genie-Public-Key': options.apiKey,
      },
    });
  } catch {
    throw new BootstrapError('Network error while connecting to Genie', 0);
  }

  if (response.status === 429) {
    throw new BootstrapError('Too many requests — try again shortly', 429);
  }

  if (response.status === 401 || response.status === 403) {
    throw new BootstrapError('Invalid or revoked public key', response.status);
  }

  if (response.status === 404) {
    throw new BootstrapError('Assistant not available', 404);
  }

  if (!response.ok) {
    throw new BootstrapError(`Bootstrap failed (${response.status})`, response.status);
  }

  const data = (await response.json()) as WidgetBootstrapResult;
  if (!data || typeof data.assistantId !== 'string' || typeof data.name !== 'string') {
    throw new BootstrapError('Invalid bootstrap response', 500);
  }
  return data;
}
