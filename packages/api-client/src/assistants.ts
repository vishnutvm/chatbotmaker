import type {
  AssistantDto,
  AssistantsListResponse,
  ChatWithAssistantRequest,
  ChatWithAssistantResponse,
  CreateAssistantRequest,
  CreateKnowledgeSourceRequest,
  KnowledgeSourceDto,
  KnowledgeSourcesResponse,
  UpdateAssistantRequest,
} from '@genie/types';
import { GenieApiClient } from './client';

/** Org-scoped assistants client — mirrors `GenieAiClient`'s path pattern. */
export class GenieAssistantsClient extends GenieApiClient {
  list(accessToken: string, organizationId: string): Promise<AssistantsListResponse> {
    return this.getJson<AssistantsListResponse>(
      `/api/v1/organizations/${organizationId}/assistants`,
      accessToken,
    );
  }

  get(accessToken: string, organizationId: string, assistantId: string): Promise<AssistantDto> {
    return this.getJson<AssistantDto>(
      `/api/v1/organizations/${organizationId}/assistants/${assistantId}`,
      accessToken,
    );
  }

  create(
    accessToken: string,
    organizationId: string,
    body: CreateAssistantRequest,
  ): Promise<AssistantDto> {
    return this.postJson<AssistantDto>(
      `/api/v1/organizations/${organizationId}/assistants`,
      body,
      accessToken,
    );
  }

  update(
    accessToken: string,
    organizationId: string,
    assistantId: string,
    body: UpdateAssistantRequest,
  ): Promise<AssistantDto> {
    return this.patchJson<AssistantDto>(
      `/api/v1/organizations/${organizationId}/assistants/${assistantId}`,
      body,
      accessToken,
    );
  }

  delete(accessToken: string, organizationId: string, assistantId: string): Promise<void> {
    return this.deleteRequest(
      `/api/v1/organizations/${organizationId}/assistants/${assistantId}`,
      accessToken,
    );
  }

  deploy(accessToken: string, organizationId: string, assistantId: string): Promise<AssistantDto> {
    return this.postJson<AssistantDto>(
      `/api/v1/organizations/${organizationId}/assistants/${assistantId}/deploy`,
      {},
      accessToken,
    );
  }

  chat(
    accessToken: string,
    organizationId: string,
    assistantId: string,
    body: ChatWithAssistantRequest,
  ): Promise<ChatWithAssistantResponse> {
    return this.postJson<ChatWithAssistantResponse>(
      `/api/v1/organizations/${organizationId}/assistants/${assistantId}/chat`,
      body,
      accessToken,
    );
  }

  listKnowledge(
    accessToken: string,
    organizationId: string,
    assistantId: string,
  ): Promise<KnowledgeSourcesResponse> {
    return this.getJson<KnowledgeSourcesResponse>(
      `/api/v1/organizations/${organizationId}/assistants/${assistantId}/knowledge`,
      accessToken,
    );
  }

  addKnowledge(
    accessToken: string,
    organizationId: string,
    assistantId: string,
    body: CreateKnowledgeSourceRequest,
  ): Promise<KnowledgeSourceDto> {
    return this.postJson<KnowledgeSourceDto>(
      `/api/v1/organizations/${organizationId}/assistants/${assistantId}/knowledge`,
      body,
      accessToken,
    );
  }

  removeKnowledge(
    accessToken: string,
    organizationId: string,
    assistantId: string,
    sourceId: string,
  ): Promise<void> {
    return this.deleteRequest(
      `/api/v1/organizations/${organizationId}/assistants/${assistantId}/knowledge/${sourceId}`,
      accessToken,
    );
  }
}

export function createAssistantsClient(baseUrl = 'http://localhost:4000'): GenieAssistantsClient {
  return new GenieAssistantsClient(baseUrl);
}
