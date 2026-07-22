import type { PrismaService } from '../../infrastructure/database/prisma.service';
import { PublishableKeysRepository } from './publishable-keys.repository';

describe('PublishableKeysRepository', () => {
  let prisma: {
    publishableApiKey: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };
  let repository: PublishableKeysRepository;

  const row = {
    id: 'key-1',
    organizationId: 'org-1',
    name: 'Default',
    keyPrefix: 'pk_live_AbCd…wxyz',
    keyHash: 'abc123',
    createdById: 'user-1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    lastUsedAt: null,
    revokedAt: null,
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    prisma = {
      publishableApiKey: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    repository = new PublishableKeysRepository(prisma as unknown as PrismaService);
  });

  it('create persists publishable key data', async () => {
    prisma.publishableApiKey.create.mockResolvedValue(row);

    const result = await repository.create({
      organizationId: 'org-1',
      name: 'Default',
      keyPrefix: row.keyPrefix,
      keyHash: row.keyHash,
      createdById: 'user-1',
    });

    expect(result).toEqual(row);
    expect(prisma.publishableApiKey.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ organizationId: 'org-1', keyHash: row.keyHash }),
    });
  });

  it('findManyByOrganization orders by newest first', async () => {
    prisma.publishableApiKey.findMany.mockResolvedValue([row]);

    await repository.findManyByOrganization('org-1');

    expect(prisma.publishableApiKey.findMany).toHaveBeenCalledWith({
      where: { organizationId: 'org-1' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('findByIdInOrganization scopes by org and id', async () => {
    prisma.publishableApiKey.findFirst.mockResolvedValue(row);

    await repository.findByIdInOrganization('org-1', 'key-1');

    expect(prisma.publishableApiKey.findFirst).toHaveBeenCalledWith({
      where: { id: 'key-1', organizationId: 'org-1' },
    });
  });

  it('findActiveByHash requires non-revoked key', async () => {
    prisma.publishableApiKey.findFirst.mockResolvedValue(row);

    await repository.findActiveByHash('hash-1');

    expect(prisma.publishableApiKey.findFirst).toHaveBeenCalledWith({
      where: { keyHash: 'hash-1', revokedAt: null },
    });
  });

  it('revoke sets revokedAt timestamp', async () => {
    const revokedAt = new Date('2026-02-01T00:00:00.000Z');
    prisma.publishableApiKey.update.mockResolvedValue({ ...row, revokedAt });

    await repository.revoke('key-1', revokedAt);

    expect(prisma.publishableApiKey.update).toHaveBeenCalledWith({
      where: { id: 'key-1' },
      data: { revokedAt },
    });
  });

  it('revoke and touchLastUsed default timestamps when omitted', async () => {
    prisma.publishableApiKey.update.mockResolvedValue(row);

    await repository.revoke('key-1');
    await repository.touchLastUsed('key-1');

    expect(prisma.publishableApiKey.update).toHaveBeenCalledTimes(2);
    expect(prisma.publishableApiKey.update.mock.calls[0][0].data.revokedAt).toBeInstanceOf(Date);
    expect(prisma.publishableApiKey.update.mock.calls[1][0].data.lastUsedAt).toBeInstanceOf(Date);
  });

  it('touchLastUsed updates lastUsedAt', async () => {
    const at = new Date('2026-03-01T00:00:00.000Z');
    prisma.publishableApiKey.update.mockResolvedValue({ ...row, lastUsedAt: at });

    await repository.touchLastUsed('key-1', at);

    expect(prisma.publishableApiKey.update).toHaveBeenCalledWith({
      where: { id: 'key-1' },
      data: { lastUsedAt: at },
    });
  });
});
