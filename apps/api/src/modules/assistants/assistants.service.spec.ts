import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { AiService } from '../ai/ai.service';
import type { OrganizationsService } from '../organizations/organizations.service';
import { AssistantsRepository } from './assistants.repository';
import { AssistantsService } from './assistants.service';

describe('AssistantsService', () => {
  const orgId = '550e8400-e29b-41d4-a716-446655440000';
  const userId = '660e8400-e29b-41d4-a716-446655440000';
  const assistantId = '770e8400-e29b-41d4-a716-446655440000';

  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const updatedAt = new Date('2026-01-02T00:00:00.000Z');

  const baseAssistant = {
    id: assistantId,
    organizationId: orgId,
    name: 'Acme Support',
    description: '',
    purpose: 'customer_support' as const,
    status: 'draft' as const,
    welcomeMessage: 'Hi! How can I help you today?',
    tone: 'friendly' as const,
    instructions: 'You are a helpful customer support assistant.',
    appearance: { primaryColor: '#6366f1', position: 'bottom-right', showWelcomeBubble: true },
    deployedAt: null as Date | null,
    createdAt,
    updatedAt,
    _count: { knowledgeSources: 0 },
  };

  let repository: jest.Mocked<AssistantsRepository>;
  let organizationsService: { requireMembership: jest.Mock };
  let aiService: { complete: jest.Mock };
  let service: AssistantsService;

  beforeEach(() => {
    repository = {
      findManyByOrganization: jest.fn(),
      findById: jest.fn(),
      findByIdWithKnowledge: jest.fn(),
      findByIdWithReadyKnowledge: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createKnowledgeSource: jest.fn(),
      findKnowledgeByAssistant: jest.fn(),
      findKnowledgeById: jest.fn(),
      deleteKnowledgeSource: jest.fn(),
    } as unknown as jest.Mocked<AssistantsRepository>;

    organizationsService = {
      requireMembership: jest.fn().mockResolvedValue({
        organization: { id: orgId },
        membership: { role: 'member' },
      }),
    };

    aiService = {
      complete: jest.fn(),
    };

    service = new AssistantsService(
      repository,
      organizationsService as unknown as OrganizationsService,
      aiService as unknown as AiService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    it('applies the purpose preset when optional fields are omitted', async () => {
      repository.create.mockResolvedValue(baseAssistant as never);

      const result = await service.create(userId, orgId, {
        name: 'Acme Support',
        purpose: 'customer_support',
      });

      expect(organizationsService.requireMembership).toHaveBeenCalledWith(userId, orgId);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: orgId,
          name: 'Acme Support',
          tone: 'friendly',
          welcomeMessage: expect.stringContaining('How can I help'),
          instructions: expect.stringContaining('customer support assistant'),
        }),
      );
      expect(result.purpose).toBe('customer_support');
      expect(result.deployed).toBe(false);
      expect(result.knowledgeSourceCount).toBe(0);
      expect(result.conversationCount).toBe(0);
    });

    it('keeps caller-supplied fields instead of the preset', async () => {
      repository.create.mockResolvedValue({
        ...baseAssistant,
        tone: 'concise',
        welcomeMessage: 'Custom welcome',
        instructions: 'Custom instructions',
      } as never);

      await service.create(userId, orgId, {
        name: 'Acme Support',
        purpose: 'customer_support',
        tone: 'concise',
        welcomeMessage: 'Custom welcome',
        instructions: 'Custom instructions',
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: 'concise',
          welcomeMessage: 'Custom welcome',
          instructions: 'Custom instructions',
        }),
      );
    });
  });

  describe('membership + tenant isolation', () => {
    it('requires membership before listing assistants', async () => {
      organizationsService.requireMembership.mockRejectedValue(new ForbiddenException());
      repository.findManyByOrganization.mockResolvedValue([]);

      await expect(service.list(userId, orgId)).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.findManyByOrganization).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the assistant does not belong to the organization', async () => {
      repository.findByIdWithKnowledge.mockResolvedValue(null);

      await expect(service.get(userId, orgId, assistantId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('forbids members from deleting an assistant', async () => {
      organizationsService.requireMembership.mockResolvedValue({
        organization: { id: orgId },
        membership: { role: 'member' },
      });

      await expect(service.delete(userId, orgId, assistantId)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('allows owners/admins to delete an assistant', async () => {
      organizationsService.requireMembership.mockResolvedValue({
        organization: { id: orgId },
        membership: { role: 'admin' },
      });
      repository.findById.mockResolvedValue(baseAssistant as never);
      repository.delete.mockResolvedValue(baseAssistant as never);

      await service.delete(userId, orgId, assistantId);
      expect(repository.delete).toHaveBeenCalledWith(assistantId);
    });
  });

  describe('deploy', () => {
    it('sets status to live and stamps deployedAt', async () => {
      repository.findById.mockResolvedValue(baseAssistant as never);
      repository.update.mockResolvedValue({
        ...baseAssistant,
        status: 'live',
        deployedAt: new Date('2026-01-03T00:00:00.000Z'),
      } as never);

      const result = await service.deploy(userId, orgId, assistantId);

      expect(repository.update).toHaveBeenCalledWith(
        assistantId,
        expect.objectContaining({ status: 'live', deployedAt: expect.any(Date) }),
      );
      expect(result.status).toBe('live');
      expect(result.deployed).toBe(true);
      expect(result.deployedAt).toBe('2026-01-03T00:00:00.000Z');
    });
  });

  describe('addKnowledge', () => {
    it('requires content for text knowledge sources', async () => {
      repository.findById.mockResolvedValue(baseAssistant as never);

      await expect(
        service.addKnowledge(userId, orgId, assistantId, { type: 'text', name: 'Empty' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.createKnowledgeSource).not.toHaveBeenCalled();
    });

    it('stores text knowledge as ready immediately', async () => {
      repository.findById.mockResolvedValue(baseAssistant as never);
      repository.createKnowledgeSource.mockResolvedValue({
        id: 'ks-1',
        organizationId: orgId,
        assistantId,
        type: 'text',
        name: 'Refund policy',
        status: 'ready',
        content: 'Refunds within 30 days.',
        url: null,
        createdAt,
        updatedAt,
      } as never);

      const result = await service.addKnowledge(userId, orgId, assistantId, {
        type: 'text',
        name: 'Refund policy',
        content: 'Refunds within 30 days.',
      });

      expect(result.status).toBe('ready');
      expect(repository.createKnowledgeSource).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'text', status: 'ready' }),
      );
    });

    it('fetches and sanitizes URL content, marking the source ready', async () => {
      repository.findById.mockResolvedValue(baseAssistant as never);
      repository.createKnowledgeSource.mockImplementation((data) =>
        Promise.resolve({
          id: 'ks-2',
          createdAt,
          updatedAt,
          ...data,
        } as never),
      );

      jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '<html><body><h1>Pricing</h1><p>Plans start at $10/mo.</p></body></html>',
      } as Response);

      const result = await service.addKnowledge(userId, orgId, assistantId, {
        type: 'url',
        name: 'Pricing page',
        url: 'https://example.com/pricing',
      });

      expect(result.status).toBe('ready');
      expect(repository.createKnowledgeSource).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'url',
          status: 'ready',
          content: expect.stringContaining('Plans start at $10/mo.'),
        }),
      );
    });

    it('marks the source failed when the URL fetch throws', async () => {
      repository.findById.mockResolvedValue(baseAssistant as never);
      repository.createKnowledgeSource.mockImplementation((data) =>
        Promise.resolve({ id: 'ks-3', createdAt, updatedAt, ...data } as never),
      );

      jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));

      const result = await service.addKnowledge(userId, orgId, assistantId, {
        type: 'url',
        name: 'Unreachable',
        url: 'https://example.com/unreachable',
      });

      expect(result.status).toBe('failed');
      expect(repository.createKnowledgeSource).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'failed', content: '' }),
      );
    });

    it('rejects private/localhost URL targets without fetching', async () => {
      repository.findById.mockResolvedValue(baseAssistant as never);
      repository.createKnowledgeSource.mockImplementation((data) =>
        Promise.resolve({ id: 'ks-4', createdAt, updatedAt, ...data } as never),
      );

      const fetchSpy = jest.spyOn(globalThis, 'fetch');

      const result = await service.addKnowledge(userId, orgId, assistantId, {
        type: 'url',
        name: 'Internal',
        url: 'http://127.0.0.1/secrets',
      });

      expect(result.status).toBe('failed');
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(repository.createKnowledgeSource).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'failed', content: '' }),
      );
    });
  });

  describe('chat', () => {
    it('builds a system prompt from instructions + ready knowledge and delegates to AiService', async () => {
      repository.findByIdWithReadyKnowledge.mockResolvedValue({
        ...baseAssistant,
        knowledgeSources: [
          {
            id: 'ks-1',
            organizationId: orgId,
            assistantId,
            type: 'text',
            name: 'Refund policy',
            status: 'ready',
            content: 'Refunds within 30 days.',
            url: null,
            createdAt,
            updatedAt,
          },
        ],
      } as never);

      aiService.complete.mockResolvedValue({
        id: 'chatcmpl_1',
        organizationId: orgId,
        model: 'gpt-4o-mini',
        content: 'We accept refunds within 30 days.',
        finishReason: 'stop',
        usage: { promptTokens: 42, completionTokens: 8, totalTokens: 50 },
      });

      const result = await service.chat(userId, orgId, assistantId, {
        messages: [{ role: 'user', content: 'What is your refund policy?' }],
      });

      expect(aiService.complete).toHaveBeenCalledWith(
        userId,
        orgId,
        expect.objectContaining({
          systemPrompt: expect.stringContaining('Refunds within 30 days.'),
          messages: [{ role: 'user', content: 'What is your refund policy?' }],
        }),
      );
      expect(result.assistantId).toBe(assistantId);
      expect(result.content).toBe('We accept refunds within 30 days.');
    });

    it('throws NotFoundException when the assistant does not exist in the organization', async () => {
      repository.findByIdWithReadyKnowledge.mockResolvedValue(null);

      await expect(
        service.chat(userId, orgId, assistantId, { messages: [{ role: 'user', content: 'hi' }] }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(aiService.complete).not.toHaveBeenCalled();
    });
  });
});
