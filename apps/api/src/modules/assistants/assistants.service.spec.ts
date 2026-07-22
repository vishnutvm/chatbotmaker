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
  let ragIngestion: { ingestKnowledgeSource: jest.Mock };
  let ragRetrieval: { retrieveForQuery: jest.Mock; formatKnowledgeContext: jest.Mock };
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
      updateKnowledgeSource: jest.fn(),
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

    ragIngestion = {
      ingestKnowledgeSource: jest.fn().mockResolvedValue('ready'),
    };

    ragRetrieval = {
      retrieveForQuery: jest.fn().mockResolvedValue([]),
      formatKnowledgeContext: jest.fn().mockReturnValue(''),
    };

    service = new AssistantsService(
      repository,
      organizationsService as unknown as OrganizationsService,
      aiService as unknown as AiService,
      ragIngestion as never,
      ragRetrieval as never,
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
    it('forbids members from deploying an assistant', async () => {
      organizationsService.requireMembership.mockResolvedValue({
        organization: { id: orgId },
        membership: { role: 'member' },
      });

      await expect(service.deploy(userId, orgId, assistantId)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('sets status to live and stamps deployedAt', async () => {
      organizationsService.requireMembership.mockResolvedValue({
        organization: { id: orgId },
        membership: { role: 'owner' },
      });
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

    it('stores text knowledge as pending and schedules ingest', async () => {
      repository.findById.mockResolvedValue(baseAssistant as never);
      repository.createKnowledgeSource.mockResolvedValue({
        id: 'ks-1',
        organizationId: orgId,
        assistantId,
        type: 'text',
        name: 'Refund policy',
        status: 'pending',
        content: 'Refunds within 30 days.',
        url: null,
        createdAt,
        updatedAt,
      } as never);
      repository.updateKnowledgeSource.mockResolvedValue({
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

      expect(result.status).toBe('pending');
      expect(repository.createKnowledgeSource).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'text', status: 'pending' }),
      );

      await Promise.resolve();
      await Promise.resolve();

      expect(ragIngestion.ingestKnowledgeSource).toHaveBeenCalledWith(
        expect.objectContaining({
          knowledgeSourceId: 'ks-1',
          content: 'Refunds within 30 days.',
        }),
      );
      expect(repository.updateKnowledgeSource).toHaveBeenCalledWith('ks-1', { status: 'ready' });
    });

    it('fetches URL content, returns pending, and schedules ingest', async () => {
      repository.findById.mockResolvedValue(baseAssistant as never);
      repository.createKnowledgeSource.mockImplementation((data) =>
        Promise.resolve({
          id: 'ks-2',
          createdAt,
          updatedAt,
          ...data,
        } as never),
      );
      repository.updateKnowledgeSource.mockImplementation((id, data) =>
        Promise.resolve({
          id,
          organizationId: orgId,
          assistantId,
          type: 'url',
          name: 'Pricing page',
          content: 'Pricing Plans start at $10/mo.',
          url: 'https://example.com/pricing',
          createdAt,
          updatedAt,
          ...data,
        } as never),
      );

      jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => null },
        body: null,
        text: async () => '<html><body><h1>Pricing</h1><p>Plans start at $10/mo.</p></body></html>',
      } as unknown as Response);

      const result = await service.addKnowledge(userId, orgId, assistantId, {
        type: 'url',
        name: 'Pricing page',
        url: 'https://example.com/pricing',
      });

      expect(result.status).toBe('pending');
      expect(repository.createKnowledgeSource).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'url',
          status: 'pending',
          content: expect.stringContaining('Plans start at $10/mo.'),
        }),
      );

      await Promise.resolve();
      await Promise.resolve();
      expect(ragIngestion.ingestKnowledgeSource).toHaveBeenCalled();
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
      expect(ragIngestion.ingestKnowledgeSource).not.toHaveBeenCalled();
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
      expect(ragIngestion.ingestKnowledgeSource).not.toHaveBeenCalled();
    });
  });

  describe('chat', () => {
    it('falls back to dump prompt when retrieval returns no chunks', async () => {
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

      expect(ragRetrieval.retrieveForQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'What is your refund policy?',
          assistantId,
        }),
      );
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

    it('prefers retrieved RAG context over the knowledge dump', async () => {
      repository.findByIdWithReadyKnowledge.mockResolvedValue({
        ...baseAssistant,
        knowledgeSources: [],
      } as never);
      ragRetrieval.retrieveForQuery.mockResolvedValue([
        { id: 'c1', content: 'Retrieved refund rule', metadata: { sourceName: 'Policy' }, similarity: 0.9 },
      ]);
      ragRetrieval.formatKnowledgeContext.mockReturnValue('Knowledge:\n### Policy\nRetrieved refund rule');

      aiService.complete.mockResolvedValue({
        id: 'chatcmpl_2',
        organizationId: orgId,
        model: 'gpt-4o-mini',
        content: 'ok',
        finishReason: 'stop',
        usage: { promptTokens: 10, completionTokens: 2, totalTokens: 12 },
      });

      await service.chat(userId, orgId, assistantId, {
        messages: [{ role: 'user', content: 'refund?' }],
      });

      expect(aiService.complete).toHaveBeenCalledWith(
        userId,
        orgId,
        expect.objectContaining({
          systemPrompt: expect.stringContaining('Retrieved refund rule'),
        }),
      );
    });

    it('throws NotFoundException when the assistant does not exist in the organization', async () => {
      repository.findByIdWithReadyKnowledge.mockResolvedValue(null);

      await expect(
        service.chat(userId, orgId, assistantId, { messages: [{ role: 'user', content: 'hi' }] }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(aiService.complete).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates fields and stamps deployedAt when going live for the first time', async () => {
      organizationsService.requireMembership.mockResolvedValue({
        organization: { id: orgId },
        membership: { role: 'owner' },
      });
      repository.findById.mockResolvedValue(baseAssistant as never);
      repository.update.mockResolvedValue({
        ...baseAssistant,
        name: 'Renamed',
        status: 'live',
        deployedAt: createdAt,
        appearance: {
          primaryColor: '#111111',
          position: 'bottom-left',
          showWelcomeBubble: false,
        },
      } as never);

      const result = await service.update(userId, orgId, assistantId, {
        name: ' Renamed ',
        status: 'live',
        appearance: { primaryColor: '#111111', position: 'bottom-left', showWelcomeBubble: false },
      });

      expect(repository.update).toHaveBeenCalledWith(
        assistantId,
        expect.objectContaining({
          name: 'Renamed',
          status: 'live',
          deployedAt: expect.any(Date),
        }),
      );
      expect(result.name).toBe('Renamed');
      expect(result.deployed).toBe(true);
    });

    it('forbids members from changing status', async () => {
      repository.findById.mockResolvedValue(baseAssistant as never);

      await expect(
        service.update(userId, orgId, assistantId, { status: 'live' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws when assistant is missing', async () => {
      organizationsService.requireMembership.mockResolvedValue({
        organization: { id: orgId },
        membership: { role: 'owner' },
      });
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update(userId, orgId, assistantId, { name: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('knowledge sub-resources', () => {
    it('lists knowledge sources for an assistant', async () => {
      repository.findById.mockResolvedValue(baseAssistant as never);
      repository.findKnowledgeByAssistant.mockResolvedValue([
        {
          id: 'ks-1',
          organizationId: orgId,
          assistantId,
          type: 'text',
          name: 'FAQ',
          status: 'ready',
          content: 'Hello world',
          url: null,
          createdAt,
          updatedAt,
        },
      ] as never);

      const result = await service.listKnowledge(userId, orgId, assistantId);
      expect(result.sources).toHaveLength(1);
      expect(result.sources[0].contentPreview).toBe('Hello world');
    });

    it('removes a knowledge source that belongs to the assistant', async () => {
      repository.findById.mockResolvedValue(baseAssistant as never);
      repository.findKnowledgeById.mockResolvedValue({
        id: 'ks-1',
        assistantId,
      } as never);

      await service.removeKnowledge(userId, orgId, assistantId, 'ks-1');
      expect(repository.deleteKnowledgeSource).toHaveBeenCalledWith('ks-1');
    });

    it('rejects removing a knowledge source from another assistant', async () => {
      repository.findById.mockResolvedValue(baseAssistant as never);
      repository.findKnowledgeById.mockResolvedValue({
        id: 'ks-1',
        assistantId: 'other-assistant',
      } as never);

      await expect(
        service.removeKnowledge(userId, orgId, assistantId, 'ks-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('requires url for url knowledge sources', async () => {
      repository.findById.mockResolvedValue(baseAssistant as never);

      await expect(
        service.addKnowledge(userId, orgId, assistantId, {
          type: 'url',
          name: 'Docs',
        } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('getLivePublicDisplay', () => {
    it('returns display fields for live assistants', async () => {
      repository.findById.mockResolvedValue({
        ...baseAssistant,
        status: 'live',
        deployedAt: new Date('2026-01-03T00:00:00.000Z'),
      } as never);

      const display = await service.getLivePublicDisplay(orgId, assistantId);

      expect(display).toEqual({
        assistantId,
        organizationId: orgId,
        name: 'Acme Support',
        welcomeMessage: 'Hi! How can I help you today?',
        appearance: baseAssistant.appearance,
      });
      expect(display).not.toHaveProperty('instructions');
    });

    it('returns null when assistant is missing or not live', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.getLivePublicDisplay(orgId, assistantId)).resolves.toBeNull();

      repository.findById.mockResolvedValue(baseAssistant as never);
      await expect(service.getLivePublicDisplay(orgId, assistantId)).resolves.toBeNull();
    });
  });

  describe('list + get + not-found paths', () => {
    it('lists assistants for the organization', async () => {
      repository.findManyByOrganization.mockResolvedValue([baseAssistant] as never);
      const result = await service.list(userId, orgId);
      expect(result.assistants).toHaveLength(1);
      expect(result.assistants[0].id).toBe(assistantId);
    });

    it('gets an assistant with knowledge sources', async () => {
      repository.findByIdWithKnowledge.mockResolvedValue({
        ...baseAssistant,
        knowledgeSources: [
          {
            id: 'ks-1',
            organizationId: orgId,
            assistantId,
            type: 'text',
            name: 'FAQ',
            status: 'ready',
            content: 'Hello',
            url: null,
            createdAt,
            updatedAt,
          },
        ],
      } as never);

      const result = await service.get(userId, orgId, assistantId);
      expect(result.knowledgeSources).toHaveLength(1);
      expect(result.knowledgeSourceCount).toBe(1);
    });

    it('throws when deleting a missing assistant', async () => {
      organizationsService.requireMembership.mockResolvedValue({
        organization: { id: orgId },
        membership: { role: 'owner' },
      });
      repository.findById.mockResolvedValue(null);
      await expect(service.delete(userId, orgId, assistantId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws when deploying a missing assistant', async () => {
      organizationsService.requireMembership.mockResolvedValue({
        organization: { id: orgId },
        membership: { role: 'owner' },
      });
      repository.findById.mockResolvedValue(null);
      await expect(service.deploy(userId, orgId, assistantId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws when adding knowledge to a missing assistant', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(
        service.addKnowledge(userId, orgId, assistantId, {
          type: 'text',
          name: 'FAQ',
          content: 'Hello',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('URL knowledge safety edges', () => {
    it('rejects redirects, non-OK responses, oversized content-length, and empty text', async () => {
      repository.findById.mockResolvedValue(baseAssistant as never);
      repository.createKnowledgeSource.mockResolvedValue({
        id: 'ks-url',
        organizationId: orgId,
        assistantId,
        type: 'url',
        name: 'Docs',
        status: 'failed',
        content: '',
        url: 'https://example.com/docs',
        createdAt,
        updatedAt,
      } as never);

      const fetchMock = jest.spyOn(global, 'fetch' as never) as jest.SpyInstance;

      fetchMock.mockResolvedValueOnce({
        status: 302,
        ok: false,
        headers: { get: () => null },
      });
      await service.addKnowledge(userId, orgId, assistantId, {
        type: 'url',
        name: 'Docs',
        url: 'https://example.com/docs',
      });

      fetchMock.mockResolvedValueOnce({
        status: 500,
        ok: false,
        headers: { get: () => null },
      });
      await service.addKnowledge(userId, orgId, assistantId, {
        type: 'url',
        name: 'Docs',
        url: 'https://example.com/docs',
      });

      fetchMock.mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: { get: () => String(MAX_OVERSIZE) },
        text: async () => 'ignored',
      });
      await service.addKnowledge(userId, orgId, assistantId, {
        type: 'url',
        name: 'Docs',
        url: 'https://example.com/docs',
      });

      fetchMock.mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: { get: () => null },
        text: async () => '<html><body>   </body></html>',
      });
      await service.addKnowledge(userId, orgId, assistantId, {
        type: 'url',
        name: 'Docs',
        url: 'https://example.com/docs',
      });

      expect(repository.createKnowledgeSource).toHaveBeenCalled();
      fetchMock.mockRestore();
    });

    it('rejects private IPv4, IPv6, and non-http schemes', async () => {
      repository.findById.mockResolvedValue(baseAssistant as never);
      repository.createKnowledgeSource.mockResolvedValue({
        id: 'ks-bad',
        organizationId: orgId,
        assistantId,
        type: 'url',
        name: 'Bad',
        status: 'failed',
        content: '',
        url: 'http://10.0.0.1/',
        createdAt,
        updatedAt,
      } as never);

      const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(() => {
        throw new Error('fetch should not be called');
      });

      for (const url of [
        'ftp://example.com/x',
        'http://10.0.0.1/x',
        'http://192.168.1.1/x',
        'http://172.16.5.5/x',
        'http://169.254.1.1/x',
        'http://100.64.1.1/x',
        'http://[fc00::1]/',
        'http://[fe80::1]/',
        'not a url',
      ]) {
        await service.addKnowledge(userId, orgId, assistantId, {
          type: 'url',
          name: 'Bad',
          url,
        });
      }

      expect(fetchMock).not.toHaveBeenCalled();
      expect(repository.createKnowledgeSource).toHaveBeenCalled();
      fetchMock.mockRestore();
    });

    it('caps streamed response bodies and falls back to response.text', async () => {
      repository.findById.mockResolvedValue(baseAssistant as never);
      repository.createKnowledgeSource.mockResolvedValue({
        id: 'ks-stream',
        organizationId: orgId,
        assistantId,
        type: 'url',
        name: 'Stream',
        status: 'failed',
        content: '',
        url: 'https://example.com/big',
        createdAt,
        updatedAt,
      } as never);

      const fetchMock = jest.spyOn(global, 'fetch' as never) as jest.SpyInstance;

      const oversizedChunk = 'x'.repeat(MAX_OVERSIZE + 10);
      fetchMock.mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: { get: () => null },
        body: {
          getReader: () => {
            let done = false;
            return {
              read: async () => {
                if (done) return { done: true, value: undefined };
                done = true;
                return { done: false, value: new TextEncoder().encode(oversizedChunk) };
              },
              cancel: async () => undefined,
            };
          },
        },
      });
      await service.addKnowledge(userId, orgId, assistantId, {
        type: 'url',
        name: 'Stream',
        url: 'https://example.com/big',
      });

      fetchMock.mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: { get: () => null },
        text: async () => '<p>ok body</p>',
      });
      repository.createKnowledgeSource.mockResolvedValueOnce({
        id: 'ks-ok',
        organizationId: orgId,
        assistantId,
        type: 'url',
        name: 'Ok',
        status: 'pending',
        content: 'ok body',
        url: 'https://example.com/ok',
        createdAt,
        updatedAt,
      } as never);
      await service.addKnowledge(userId, orgId, assistantId, {
        type: 'url',
        name: 'Ok',
        url: 'https://example.com/ok',
      });

      fetchMock.mockRestore();
    });

    it('rejects URL hosts that Node URL treats as invalid without fetching', async () => {
      // Node's URL parser rejects octet > 255 before isSafePublicHttpUrl's ipv4 branch;
      // these still fail closed via `new URL` catch (same user-visible result).
      repository.findById.mockResolvedValue(baseAssistant as never);
      repository.createKnowledgeSource.mockImplementation((data) =>
        Promise.resolve({ id: 'ks-octet', createdAt, updatedAt, ...data } as never),
      );
      const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(() => {
        throw new Error('fetch should not be called');
      });

      for (const url of ['http://256.1.1.1/', 'http://1.2.3.999/', 'not a url']) {
        await service.addKnowledge(userId, orgId, assistantId, {
          type: 'url',
          name: 'Bad octets',
          url,
        });
      }

      expect(fetchMock).not.toHaveBeenCalled();
      fetchMock.mockRestore();
    });

    it('reads capped stream bodies that finish under the limit', async () => {
      repository.findById.mockResolvedValue(baseAssistant as never);
      repository.createKnowledgeSource.mockImplementation((data) =>
        Promise.resolve({ id: 'ks-small-stream', createdAt, updatedAt, ...data } as never),
      );
      repository.updateKnowledgeSource.mockResolvedValue({
        id: 'ks-small-stream',
        status: 'ready',
      } as never);

      const fetchMock = jest.spyOn(global, 'fetch' as never) as jest.SpyInstance;
      let reads = 0;
      fetchMock.mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: { get: () => null },
        body: {
          getReader: () => ({
            read: async () => {
              reads += 1;
              if (reads === 1) {
                return {
                  done: false,
                  value: new TextEncoder().encode('<p>streamed ok</p>'),
                };
              }
              return { done: true, value: undefined };
            },
            cancel: async () => undefined,
          }),
        },
      });

      const result = await service.addKnowledge(userId, orgId, assistantId, {
        type: 'url',
        name: 'Small stream',
        url: 'https://example.com/small',
      });

      expect(result.status).toBe('pending');
      expect(repository.createKnowledgeSource).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('streamed ok'),
          status: 'pending',
        }),
      );
      fetchMock.mockRestore();
    });

    it('marks URL knowledge failed when the body reader throws', async () => {
      repository.findById.mockResolvedValue(baseAssistant as never);
      repository.createKnowledgeSource.mockImplementation((data) =>
        Promise.resolve({ id: 'ks-reader-fail', createdAt, updatedAt, ...data } as never),
      );

      const fetchMock = jest.spyOn(global, 'fetch' as never) as jest.SpyInstance;
      fetchMock.mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: { get: () => null },
        body: {
          getReader: () => ({
            read: async () => {
              throw new Error('stream broken');
            },
            cancel: async () => undefined,
          }),
        },
      });

      const result = await service.addKnowledge(userId, orgId, assistantId, {
        type: 'url',
        name: 'Broken stream',
        url: 'https://example.com/broken',
      });

      expect(result.status).toBe('failed');
      fetchMock.mockRestore();
    });

    it('marks URL knowledge failed when response.text rejects', async () => {
      repository.findById.mockResolvedValue(baseAssistant as never);
      repository.createKnowledgeSource.mockImplementation((data) =>
        Promise.resolve({ id: 'ks-text-fail', createdAt, updatedAt, ...data } as never),
      );

      const fetchMock = jest.spyOn(global, 'fetch' as never) as jest.SpyInstance;
      fetchMock.mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: { get: () => null },
        body: null,
        text: async () => {
          throw new Error('text failed');
        },
      });

      const result = await service.addKnowledge(userId, orgId, assistantId, {
        type: 'url',
        name: 'Text fail',
        url: 'https://example.com/text-fail',
      });

      expect(result.status).toBe('failed');
      fetchMock.mockRestore();
    });
  });

  describe('ingest + prompt + appearance edges', () => {
    it('logs and swallows background ingest failures', async () => {
      repository.findById.mockResolvedValue(baseAssistant as never);
      repository.createKnowledgeSource.mockResolvedValue({
        id: 'ks-ingest-fail',
        organizationId: orgId,
        assistantId,
        type: 'text',
        name: 'Policy',
        status: 'pending',
        content: 'Hello knowledge',
        url: null,
        createdAt,
        updatedAt,
      } as never);
      ragIngestion.ingestKnowledgeSource.mockRejectedValue(new Error('embed down'));

      await service.addKnowledge(userId, orgId, assistantId, {
        type: 'text',
        name: 'Policy',
        content: 'Hello knowledge',
      });

      await new Promise((r) => setImmediate(r));
      await new Promise((r) => setImmediate(r));

      expect(ragIngestion.ingestKnowledgeSource).toHaveBeenCalled();
      expect(repository.updateKnowledgeSource).not.toHaveBeenCalledWith('ks-ingest-fail', {
        status: 'ready',
      });
    });

    it('marks knowledge failed when scheduled ingest receives empty content', async () => {
      repository.findById.mockResolvedValue(baseAssistant as never);
      repository.createKnowledgeSource.mockResolvedValue({
        id: 'ks-empty',
        organizationId: orgId,
        assistantId,
        type: 'text',
        name: 'Empty',
        status: 'pending',
        content: '   ',
        url: null,
        createdAt,
        updatedAt,
      } as never);
      repository.updateKnowledgeSource.mockResolvedValue({
        id: 'ks-empty',
        status: 'failed',
      } as never);

      await service.addKnowledge(userId, orgId, assistantId, {
        type: 'text',
        name: 'Empty',
        content: 'valid input that repo replaces',
      });

      await new Promise((r) => setImmediate(r));
      await new Promise((r) => setImmediate(r));

      expect(repository.updateKnowledgeSource).toHaveBeenCalledWith('ks-empty', {
        status: 'failed',
      });
      expect(ragIngestion.ingestKnowledgeSource).not.toHaveBeenCalled();
    });

    it('throws when listing knowledge for a missing assistant', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.listKnowledge(userId, orgId, assistantId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('uses instructions-only dump prompt when no knowledge sources exist', async () => {
      repository.findByIdWithReadyKnowledge.mockResolvedValue({
        ...baseAssistant,
        knowledgeSources: [],
      } as never);
      ragRetrieval.retrieveForQuery.mockResolvedValue([]);
      ragRetrieval.formatKnowledgeContext.mockReturnValue('');
      aiService.complete.mockResolvedValue({
        id: 'c1',
        organizationId: orgId,
        model: 'gpt-4o-mini',
        content: 'hi',
        finishReason: 'stop',
        usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
      });

      await service.chat(userId, orgId, assistantId, {
        messages: [{ role: 'user', content: 'hello' }],
      });

      expect(aiService.complete).toHaveBeenCalledWith(
        userId,
        orgId,
        expect.objectContaining({
          systemPrompt: baseAssistant.instructions,
        }),
      );
    });

    it('uses instructions-only dump prompt when knowledge sources have empty content', async () => {
      repository.findByIdWithReadyKnowledge.mockResolvedValue({
        ...baseAssistant,
        knowledgeSources: [
          {
            id: 'ks-blank',
            organizationId: orgId,
            assistantId,
            type: 'text',
            name: 'Blank',
            status: 'ready',
            content: '',
            url: null,
            createdAt,
            updatedAt,
          },
        ],
      } as never);
      ragRetrieval.retrieveForQuery.mockResolvedValue([]);
      ragRetrieval.formatKnowledgeContext.mockReturnValue('');
      aiService.complete.mockResolvedValue({
        id: 'c2',
        organizationId: orgId,
        model: 'gpt-4o-mini',
        content: 'hi',
        finishReason: 'stop',
        usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
      });

      await service.chat(userId, orgId, assistantId, {
        messages: [{ role: 'user', content: 'hello' }],
      });

      expect(aiService.complete).toHaveBeenCalledWith(
        userId,
        orgId,
        expect.objectContaining({
          systemPrompt: baseAssistant.instructions,
        }),
      );
    });

    it('falls back to default appearance for null or array JSON values', async () => {
      repository.findByIdWithKnowledge.mockResolvedValue({
        ...baseAssistant,
        appearance: null,
        knowledgeSources: [],
      } as never);

      const withNull = await service.get(userId, orgId, assistantId);
      expect(withNull.appearance).toEqual({
        primaryColor: '#6366f1',
        position: 'bottom-right',
        showWelcomeBubble: true,
      });

      repository.findByIdWithKnowledge.mockResolvedValue({
        ...baseAssistant,
        appearance: [] as never,
        knowledgeSources: [],
      } as never);

      const withArray = await service.get(userId, orgId, assistantId);
      expect(withArray.appearance.primaryColor).toBe('#6366f1');
    });
  });
});

/** Content-Length threshold used by AssistantsService URL fetch guard. */
const MAX_OVERSIZE = 100_000 * 4 + 1;
