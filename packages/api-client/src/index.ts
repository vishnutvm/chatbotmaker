export { GenieApiClient } from './client';
export { GenieAuthClient } from './auth';

import { GenieApiClient } from './client';
import { GenieAuthClient } from './auth';

export function createApiClient(baseUrl = 'http://localhost:4000'): GenieApiClient {
  return new GenieApiClient(baseUrl);
}

export function createAuthClient(baseUrl = 'http://localhost:4000'): GenieAuthClient {
  return new GenieAuthClient(baseUrl);
}
