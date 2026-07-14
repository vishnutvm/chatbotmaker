import type { ChatCompletionRequest, ChatCompletionResponse } from '@genie/types';
import { GenieApiClient } from './client';

export class GenieAiClient extends GenieApiClient {
  complete(
    accessToken: string,
    organizationId: string,
    body: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse> {
    return this.postJson<ChatCompletionResponse>(
      `/api/v1/organizations/${organizationId}/ai/chat/completions`,
      body,
      accessToken,
    );
  }
}

export function createAiClient(baseUrl = 'http://localhost:4000'): GenieAiClient {
  return new GenieAiClient(baseUrl);
}
