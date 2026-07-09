import type { Assistant } from '@genie/types';

/** Stub — wire to GET/POST/PATCH/DELETE /api/v1/assistants when Phase 6 completes */
export interface AssistantsClient {
  list(token: string): Promise<Assistant[]>;
  get(token: string, id: string): Promise<Assistant>;
  create(token: string, data: Partial<Assistant>): Promise<Assistant>;
  update(token: string, id: string, data: Partial<Assistant>): Promise<Assistant>;
  delete(token: string, id: string): Promise<void>;
}

export function createAssistantsClient(_baseUrl: string): AssistantsClient {
  return {
    async list() {
      throw new Error('Assistants API not implemented — use mock hooks');
    },
    async get() {
      throw new Error('Assistants API not implemented — use mock hooks');
    },
    async create() {
      throw new Error('Assistants API not implemented — use mock hooks');
    },
    async update() {
      throw new Error('Assistants API not implemented — use mock hooks');
    },
    async delete() {
      throw new Error('Assistants API not implemented — use mock hooks');
    },
  };
}
