import type { PrismaService } from '../../infrastructure/database/prisma.service';
import { AssistantsRepository } from './assistants.repository';

describe('AssistantsRepository', () => {
  let prisma: {
    assistant: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    knowledgeSource: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let repository: AssistantsRepository;

  beforeEach(() => {
    prisma = {
      assistant: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      knowledgeSource: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    repository = new AssistantsRepository(prisma as unknown as PrismaService);
  });

  it('findManyByOrganization orders by updatedAt desc with knowledge count', async () => {
    prisma.assistant.findMany.mockResolvedValue([]);
    await repository.findManyByOrganization('org-1');
    expect(prisma.assistant.findMany).toHaveBeenCalledWith({
      where: { organizationId: 'org-1' },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { knowledgeSources: true } } },
    });
  });

  it('findById scopes by organization and includes count', async () => {
    prisma.assistant.findFirst.mockResolvedValue(null);
    await repository.findById('org-1', 'a-1');
    expect(prisma.assistant.findFirst).toHaveBeenCalledWith({
      where: { id: 'a-1', organizationId: 'org-1' },
      include: { _count: { select: { knowledgeSources: true } } },
    });
  });

  it('findByIdWithKnowledge includes all knowledge sources', async () => {
    prisma.assistant.findFirst.mockResolvedValue(null);
    await repository.findByIdWithKnowledge('org-1', 'a-1');
    expect(prisma.assistant.findFirst).toHaveBeenCalledWith({
      where: { id: 'a-1', organizationId: 'org-1' },
      include: { knowledgeSources: { orderBy: { createdAt: 'desc' } } },
    });
  });

  it('findByIdWithReadyKnowledge filters status ready', async () => {
    prisma.assistant.findFirst.mockResolvedValue(null);
    await repository.findByIdWithReadyKnowledge('org-1', 'a-1');
    expect(prisma.assistant.findFirst).toHaveBeenCalledWith({
      where: { id: 'a-1', organizationId: 'org-1' },
      include: {
        knowledgeSources: { where: { status: 'ready' }, orderBy: { createdAt: 'desc' } },
      },
    });
  });

  it('create/update/delete delegate to prisma with count include', async () => {
    prisma.assistant.create.mockResolvedValue({ id: 'a-1' });
    prisma.assistant.update.mockResolvedValue({ id: 'a-1' });
    prisma.assistant.delete.mockResolvedValue({ id: 'a-1' });

    await repository.create({ organizationId: 'org-1', name: 'Bot' } as never);
    await repository.update('a-1', { name: 'Bot 2' });
    await repository.delete('a-1');

    expect(prisma.assistant.create).toHaveBeenCalledWith({
      data: { organizationId: 'org-1', name: 'Bot' },
      include: { _count: { select: { knowledgeSources: true } } },
    });
    expect(prisma.assistant.update).toHaveBeenCalledWith({
      where: { id: 'a-1' },
      data: { name: 'Bot 2' },
      include: { _count: { select: { knowledgeSources: true } } },
    });
    expect(prisma.assistant.delete).toHaveBeenCalledWith({ where: { id: 'a-1' } });
  });

  it('knowledge source CRUD delegates to prisma', async () => {
    prisma.knowledgeSource.create.mockResolvedValue({ id: 'ks-1' });
    prisma.knowledgeSource.findMany.mockResolvedValue([]);
    prisma.knowledgeSource.findUnique.mockResolvedValue(null);
    prisma.knowledgeSource.update.mockResolvedValue({ id: 'ks-1' });
    prisma.knowledgeSource.delete.mockResolvedValue({ id: 'ks-1' });

    await repository.createKnowledgeSource({
      organizationId: 'org-1',
      assistantId: 'a-1',
      type: 'text',
      name: 'FAQ',
      status: 'pending',
    } as never);
    await repository.findKnowledgeByAssistant('a-1');
    await repository.findKnowledgeById('ks-1');
    await repository.updateKnowledgeSource('ks-1', { status: 'ready' });
    await repository.deleteKnowledgeSource('ks-1');

    expect(prisma.knowledgeSource.create).toHaveBeenCalled();
    expect(prisma.knowledgeSource.findMany).toHaveBeenCalledWith({
      where: { assistantId: 'a-1' },
      orderBy: { createdAt: 'desc' },
    });
    expect(prisma.knowledgeSource.findUnique).toHaveBeenCalledWith({ where: { id: 'ks-1' } });
    expect(prisma.knowledgeSource.update).toHaveBeenCalledWith({
      where: { id: 'ks-1' },
      data: { status: 'ready' },
    });
    expect(prisma.knowledgeSource.delete).toHaveBeenCalledWith({ where: { id: 'ks-1' } });
  });
});
