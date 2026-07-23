export { GenieApiClient } from './client';
export { GenieAuthClient } from './auth';
export {
  GenieOrganizationsClient,
  createOrganizationsClient,
} from './organizations';
export { GenieAiClient, createAiClient } from './ai';
export { GenieAssistantsClient, createAssistantsClient } from './assistants';
export {
  GeniePublishableKeysClient,
  createPublishableKeysClient,
} from './publishable-keys';
export { GenieBillingClient, createBillingClient } from './billing';
export { createConversationsClient, type ConversationsClient } from './conversations';

import { GenieApiClient } from './client';
import { GenieAuthClient } from './auth';

export function createApiClient(baseUrl = 'http://localhost:4000'): GenieApiClient {
  return new GenieApiClient(baseUrl);
}

export function createAuthClient(baseUrl = 'http://localhost:4000'): GenieAuthClient {
  return new GenieAuthClient(baseUrl);
}
