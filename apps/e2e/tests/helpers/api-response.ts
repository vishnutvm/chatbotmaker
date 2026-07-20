import type { APIResponse } from '@playwright/test';

/** Fail with response body when status does not match — speeds up CI diagnosis. */
export async function expectApiStatus(
  response: APIResponse,
  expected: number,
  label: string,
): Promise<void> {
  const actual = response.status();
  if (actual === expected) {
    return;
  }

  let body = '';
  try {
    body = await response.text();
  } catch {
    body = '(could not read body)';
  }

  throw new Error(
    `${label}: expected HTTP ${expected}, got ${actual}. Body: ${body.slice(0, 2000)}`,
  );
}

export function isRateLimitResponse(status: number, body: string): boolean {
  if (status === 429) {
    return true;
  }
  return /rate limit|too many requests|over_email_send_rate_limit/i.test(body);
}
