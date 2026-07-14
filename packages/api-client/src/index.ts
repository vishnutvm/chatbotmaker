export { GenieApiClient } from './client';
export { GenieAuthClient } from './auth';
export {
  GenieOrganizationsClient,
  createOrganizationsClient,
} from './organizations';
export { GenieAiClient, createAiClient } from './ai';
export { createAssistantsClient, type AssistantsClient } from './assistants';
export { createConversationsClient, type ConversationsClient } from './conversations';

import { GenieApiClient } from './client';
import { GenieAuthClient } from './auth';

export function createApiClient(baseUrl = 'http://localhost:4000'): GenieApiClient {
  return new GenieApiClient(baseUrl);
}

export function createAuthClient(baseUrl = 'http://localhost:4000'): GenieAuthClient {
  return new GenieAuthClient(baseUrl);
}
