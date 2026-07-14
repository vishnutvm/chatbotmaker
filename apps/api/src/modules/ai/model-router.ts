import { Injectable } from '@nestjs/common';
import { getAiDefaultModel } from '../../config/env';

/** U1: returns the server-enforced default model only — no client override. */
@Injectable()
export class ModelRouter {
  resolveChatModel(_organizationId?: string): string {
    return getAiDefaultModel();
  }
}
