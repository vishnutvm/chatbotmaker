import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type {
  Assistant as AssistantRow,
  KnowledgeSource as KnowledgeSourceRow,
  Prisma,
} from '@prisma/client';
import type {
  AssistantAppearance,
  AssistantDto,
  AssistantsListResponse,
  ChatWithAssistantResponse,
  KnowledgeSourceDto,
  KnowledgeSourcesResponse,
  OrganizationRole,
} from '@genie/types';
import { AiService } from '../ai/ai.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { ASSISTANT_PURPOSE_PRESETS } from './assistant-presets';
import type { AssistantWithCount, AssistantWithKnowledge } from './assistants.repository';
import { AssistantsRepository } from './assistants.repository';
import type {
  ChatWithAssistantDto,
  CreateAssistantDto,
  CreateKnowledgeSourceDto,
  UpdateAssistantDto,
} from './dto/assistants.dto';

const MANAGER_ROLES: OrganizationRole[] = ['owner', 'admin'];

/** MVP knowledge limits — full crawl/embeddings ingestion is a later phase. */
const MAX_KNOWLEDGE_CONTENT_CHARS = 100_000;
const URL_FETCH_TIMEOUT_MS = 10_000;
const URL_FETCH_USER_AGENT = 'GenieBot/1.0';
/** Chat system-prompt knowledge budget — keeps prompt tokens/cost bounded. */
const KNOWLEDGE_PROMPT_CHAR_BUDGET = 12_000;

const DEFAULT_APPEARANCE: AssistantAppearance = {
  primaryColor: '#6366f1',
  position: 'bottom-right',
  showWelcomeBubble: true,
};

@Injectable()
export class AssistantsService {
  private readonly logger = new Logger(AssistantsService.name);

  constructor(
    private readonly assistantsRepository: AssistantsRepository,
    private readonly organizationsService: OrganizationsService,
    private readonly aiService: AiService,
  ) {}

  async list(userId: string, organizationId: string): Promise<AssistantsListResponse> {
    await this.organizationsService.requireMembership(userId, organizationId);
    const assistants = await this.assistantsRepository.findManyByOrganization(organizationId);
    return { assistants: assistants.map((a) => this.toDto(a)) };
  }

  async create(
    userId: string,
    organizationId: string,
    dto: CreateAssistantDto,
  ): Promise<AssistantDto> {
    await this.organizationsService.requireMembership(userId, organizationId);

    const preset = ASSISTANT_PURPOSE_PRESETS[dto.purpose];
    const created = await this.assistantsRepository.create({
      organizationId,
      name: dto.name.trim(),
      description: dto.description?.trim() ?? '',
      purpose: dto.purpose,
      welcomeMessage: dto.welcomeMessage?.trim() || preset.welcomeMessage,
      tone: dto.tone ?? preset.tone,
      instructions: dto.instructions?.trim() || preset.instructions,
      appearance: DEFAULT_APPEARANCE as unknown as Prisma.InputJsonValue,
    });

    return this.toDto(created);
  }

  async get(userId: string, organizationId: string, assistantId: string): Promise<AssistantDto> {
    await this.organizationsService.requireMembership(userId, organizationId);
    const assistant = await this.assistantsRepository.findByIdWithKnowledge(
      organizationId,
      assistantId,
    );
    if (!assistant) {
      throw new NotFoundException('Assistant not found');
    }
    return this.toDto(assistant, assistant.knowledgeSources);
  }

  async update(
    userId: string,
    organizationId: string,
    assistantId: string,
    dto: UpdateAssistantDto,
  ): Promise<AssistantDto> {
    await this.organizationsService.requireMembership(userId, organizationId);

    const existing = await this.assistantsRepository.findById(organizationId, assistantId);
    if (!existing) {
      throw new NotFoundException('Assistant not found');
    }

    const data: Prisma.AssistantUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined) data.description = dto.description.trim();
    if (dto.purpose !== undefined) data.purpose = dto.purpose;
    if (dto.welcomeMessage !== undefined) data.welcomeMessage = dto.welcomeMessage.trim();
    if (dto.tone !== undefined) data.tone = dto.tone;
    if (dto.instructions !== undefined) data.instructions = dto.instructions.trim();
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.appearance !== undefined) {
      data.appearance = {
        ...this.toAppearance(existing.appearance),
        ...dto.appearance,
      } as unknown as Prisma.InputJsonValue;
    }

    const updated = await this.assistantsRepository.update(assistantId, data);
    return this.toDto(updated);
  }

  async delete(userId: string, organizationId: string, assistantId: string): Promise<void> {
    const { membership } = await this.organizationsService.requireMembership(userId, organizationId);
    this.requireManager(membership.role as OrganizationRole);

    const existing = await this.assistantsRepository.findById(organizationId, assistantId);
    if (!existing) {
      throw new NotFoundException('Assistant not found');
    }

    await this.assistantsRepository.delete(assistantId);
  }

  async deploy(userId: string, organizationId: string, assistantId: string): Promise<AssistantDto> {
    await this.organizationsService.requireMembership(userId, organizationId);

    const existing = await this.assistantsRepository.findById(organizationId, assistantId);
    if (!existing) {
      throw new NotFoundException('Assistant not found');
    }

    const updated = await this.assistantsRepository.update(assistantId, {
      status: 'live',
      deployedAt: new Date(),
    });
    return this.toDto(updated);
  }

  async addKnowledge(
    userId: string,
    organizationId: string,
    assistantId: string,
    dto: CreateKnowledgeSourceDto,
  ): Promise<KnowledgeSourceDto> {
    await this.organizationsService.requireMembership(userId, organizationId);

    const assistant = await this.assistantsRepository.findById(organizationId, assistantId);
    if (!assistant) {
      throw new NotFoundException('Assistant not found');
    }

    if (dto.type === 'text') {
      const content = dto.content?.trim();
      if (!content) {
        throw new BadRequestException('content is required for text knowledge sources');
      }

      const created = await this.assistantsRepository.createKnowledgeSource({
        organizationId,
        assistantId,
        type: 'text',
        name: dto.name.trim(),
        status: 'ready',
        content: content.slice(0, MAX_KNOWLEDGE_CONTENT_CHARS),
        url: null,
      });
      return this.toKnowledgeDto(created);
    }

    const url = dto.url?.trim();
    if (!url) {
      throw new BadRequestException('url is required for url knowledge sources');
    }

    const { content, status } = await this.fetchUrlContent(url);
    const created = await this.assistantsRepository.createKnowledgeSource({
      organizationId,
      assistantId,
      type: 'url',
      name: dto.name.trim(),
      status,
      content,
      url,
    });
    return this.toKnowledgeDto(created);
  }

  async listKnowledge(
    userId: string,
    organizationId: string,
    assistantId: string,
  ): Promise<KnowledgeSourcesResponse> {
    await this.organizationsService.requireMembership(userId, organizationId);
    await this.requireAssistant(organizationId, assistantId);

    const sources = await this.assistantsRepository.findKnowledgeByAssistant(assistantId);
    return { sources: sources.map((s) => this.toKnowledgeDto(s)) };
  }

  async removeKnowledge(
    userId: string,
    organizationId: string,
    assistantId: string,
    sourceId: string,
  ): Promise<void> {
    await this.organizationsService.requireMembership(userId, organizationId);
    await this.requireAssistant(organizationId, assistantId);

    const source = await this.assistantsRepository.findKnowledgeById(sourceId);
    if (!source || source.assistantId !== assistantId) {
      throw new NotFoundException('Knowledge source not found');
    }

    await this.assistantsRepository.deleteKnowledgeSource(sourceId);
  }

  async chat(
    userId: string,
    organizationId: string,
    assistantId: string,
    dto: ChatWithAssistantDto,
  ): Promise<ChatWithAssistantResponse> {
    await this.organizationsService.requireMembership(userId, organizationId);

    const assistant = await this.assistantsRepository.findByIdWithReadyKnowledge(
      organizationId,
      assistantId,
    );
    if (!assistant) {
      throw new NotFoundException('Assistant not found');
    }

    const systemPrompt = this.buildSystemPrompt(assistant);
    const result = await this.aiService.complete(userId, organizationId, {
      systemPrompt,
      messages: dto.messages,
    });

    return { ...result, assistantId };
  }

  /**
   * Asserts the assistant belongs to the organization. Public within the module for
   * knowledge sub-resource routes that don't need the full assistant payload.
   */
  private async requireAssistant(organizationId: string, assistantId: string): Promise<AssistantRow> {
    const assistant = await this.assistantsRepository.findById(organizationId, assistantId);
    if (!assistant) {
      throw new NotFoundException('Assistant not found');
    }
    return assistant;
  }

  private requireManager(role: OrganizationRole): void {
    if (!MANAGER_ROLES.includes(role)) {
      throw new ForbiddenException('Owner or admin role required');
    }
  }

  /** Instructions + knowledge contents, capped to a bounded token/cost budget. */
  private buildSystemPrompt(assistant: AssistantWithKnowledge): string {
    const preset = ASSISTANT_PURPOSE_PRESETS[assistant.purpose];
    const instructions = assistant.instructions?.trim() || preset.instructions;

    const sources = assistant.knowledgeSources ?? [];
    if (sources.length === 0) {
      return instructions;
    }

    let remaining = KNOWLEDGE_PROMPT_CHAR_BUDGET;
    const chunks: string[] = [];
    for (const source of sources) {
      if (remaining <= 0) break;
      const text = (source.content ?? '').slice(0, remaining);
      if (!text) continue;
      chunks.push(`### ${source.name}\n${text}`);
      remaining -= text.length;
    }

    if (chunks.length === 0) {
      return instructions;
    }

    return `${instructions}\n\nKnowledge:\n${chunks.join('\n\n')}`;
  }

  /**
   * Fetches and sanitizes URL knowledge content; never throws — failures degrade to `failed` status.
   * Blocks clearly unsafe targets (non-http(s), localhost, private/link-local IPs) to reduce SSRF risk.
   */
  private async fetchUrlContent(
    url: string,
  ): Promise<{ content: string; status: 'ready' | 'failed' }> {
    if (!this.isSafePublicHttpUrl(url)) {
      this.logger.warn('Knowledge URL rejected as unsafe target');
      return { content: '', status: 'failed' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), URL_FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': URL_FETCH_USER_AGENT },
        redirect: 'manual',
      });

      // Do not follow redirects — a public URL can bounce to an internal host.
      if (response.status >= 300 && response.status < 400) {
        this.logger.warn('Knowledge URL fetch refused redirect', { status: response.status });
        return { content: '', status: 'failed' };
      }

      if (!response.ok) {
        this.logger.warn('Knowledge URL fetch returned non-OK status', { status: response.status });
        return { content: '', status: 'failed' };
      }

      const html = await response.text();
      const text = this.stripHtml(html);
      if (!text) {
        return { content: '', status: 'failed' };
      }

      return { content: text.slice(0, MAX_KNOWLEDGE_CONTENT_CHARS), status: 'ready' };
    } catch (error) {
      this.logger.warn('Knowledge URL fetch failed', {
        name: error instanceof Error ? error.name : 'unknown',
      });
      return { content: '', status: 'failed' };
    } finally {
      clearTimeout(timeout);
    }
  }

  /** Rejects non-http(s), localhost, and literal private/link-local IP hosts (hostname DNS rebinding still residual). */
  private isSafePublicHttpUrl(raw: string): boolean {
    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      return false;
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '0.0.0.0' ||
      host.endsWith('.localhost') ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      return false;
    }

    // IPv4 literals — block loopback, RFC1918, link-local, CGNAT.
    const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
    if (ipv4) {
      const octets = ipv4.slice(1).map((part) => Number(part));
      if (octets.some((n) => Number.isNaN(n) || n > 255)) {
        return false;
      }
      const [a, b] = octets;
      if (a === 10) return false;
      if (a === 127) return false;
      if (a === 0) return false;
      if (a === 169 && b === 254) return false;
      if (a === 172 && b >= 16 && b <= 31) return false;
      if (a === 192 && b === 168) return false;
      if (a === 100 && b >= 64 && b <= 127) return false;
    }

    // IPv6 literals — block loopback and unique-local (fc/fd) and link-local (fe80).
    if (host.includes(':')) {
      if (host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80')) {
        return false;
      }
    }

    return true;
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  private toAppearance(value: Prisma.JsonValue): AssistantAppearance {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return DEFAULT_APPEARANCE;
    }
    const raw = value as Record<string, unknown>;
    return {
      primaryColor:
        typeof raw.primaryColor === 'string' ? raw.primaryColor : DEFAULT_APPEARANCE.primaryColor,
      position: raw.position === 'bottom-left' ? 'bottom-left' : DEFAULT_APPEARANCE.position,
      showWelcomeBubble:
        typeof raw.showWelcomeBubble === 'boolean'
          ? raw.showWelcomeBubble
          : DEFAULT_APPEARANCE.showWelcomeBubble,
      avatarUrl: typeof raw.avatarUrl === 'string' ? raw.avatarUrl : undefined,
    };
  }

  private toDto(row: AssistantWithCount | AssistantRow, knowledgeSources?: KnowledgeSourceRow[]): AssistantDto {
    const knowledgeSourceCount = knowledgeSources
      ? knowledgeSources.length
      : (row as AssistantWithCount)._count?.knowledgeSources ?? 0;

    return {
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      description: row.description,
      purpose: row.purpose,
      status: row.status,
      welcomeMessage: row.welcomeMessage,
      tone: row.tone,
      instructions: row.instructions,
      knowledgeSourceCount,
      conversationCount: 0,
      appearance: this.toAppearance(row.appearance),
      deployed: row.deployedAt !== null,
      deployedAt: row.deployedAt ? row.deployedAt.toISOString() : undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      knowledgeSources: knowledgeSources?.map((s) => this.toKnowledgeDto(s)),
    };
  }

  private toKnowledgeDto(source: KnowledgeSourceRow): KnowledgeSourceDto {
    return {
      id: source.id,
      assistantId: source.assistantId,
      name: source.name,
      type: source.type,
      status: source.status,
      url: source.url ?? undefined,
      contentPreview: source.content ? source.content.slice(0, 200) : undefined,
      pageCount: source.type === 'url' ? 1 : 0,
      documentCount: 1,
      lastUpdatedAt: source.updatedAt.toISOString(),
    };
  }
}
