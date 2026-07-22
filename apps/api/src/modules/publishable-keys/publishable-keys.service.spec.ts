import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PublishableKeyHasher } from './publishable-key.hasher';
import { PublishableKeysService } from './publishable-keys.service';

describe('PublishableKeysService', () => {
  const originalPepper = process.env.PUBLISHABLE_KEY_PEPPER;
  let hasher: PublishableKeyHasher;
  let repository: {
    create: jest.Mock;
    findManyByOrganization: jest.Mock;
    findByIdInOrganization: jest.Mock;
    findActiveByHash: jest.Mock;
    revoke: jest.Mock;
    touchLastUsed: jest.Mock;
  };
  let organizationsService: { requireMembership: jest.Mock };
  let service: PublishableKeysService;

  beforeEach(() => {
    process.env.PUBLISHABLE_KEY_PEPPER = 'test-pepper';
    hasher = new PublishableKeyHasher();
    repository = {
      create: jest.fn(),
      findManyByOrganization: jest.fn(),
      findByIdInOrganization: jest.fn(),
      findActiveByHash: jest.fn(),
      revoke: jest.fn(),
      touchLastUsed: jest.fn(),
    };
    organizationsService = {
      requireMembership: jest.fn().mockResolvedValue({
        membership: { role: 'owner' },
        organization: { id: 'org-1' },
      }),
    };
    service = new PublishableKeysService(
      repository as never,
      hasher,
      organizationsService as never,
    );
  });

  afterEach(() => {
    if (originalPepper === undefined) {
      delete process.env.PUBLISHABLE_KEY_PEPPER;
    } else {
      process.env.PUBLISHABLE_KEY_PEPPER = originalPepper;
    }
  });

  it('create returns plaintext once and stores hash only', async () => {
    repository.create.mockImplementation(async (data: { keyHash: string; keyPrefix: string }) => ({
      id: 'key-1',
      organizationId: 'org-1',
      name: 'Default',
      keyPrefix: data.keyPrefix,
      keyHash: data.keyHash,
      createdById: 'user-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      lastUsedAt: null,
      revokedAt: null,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    }));

    const created = await service.create('user-1', 'org-1');
    expect(created.key).toMatch(/^pk_live_/);
    expect(created.keyPrefix).toContain('…');
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        createdById: 'user-1',
        keyHash: hasher.hash(created.key),
      }),
    );
    expect(JSON.stringify(repository.create.mock.calls[0][0])).not.toContain(created.key);
  });

  it('list never includes plaintext key', async () => {
    repository.findManyByOrganization.mockResolvedValue([
      {
        id: 'key-1',
        organizationId: 'org-1',
        name: 'Default',
        keyPrefix: 'pk_live_AbCd…wxyz',
        keyHash: 'abc',
        createdById: 'user-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        lastUsedAt: null,
        revokedAt: null,
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);

    const result = await service.list('user-1', 'org-1');
    expect(result.keys).toHaveLength(1);
    expect(result.keys[0]).not.toHaveProperty('key');
    expect(result.keys[0]).not.toHaveProperty('keyHash');
  });

  it('rejects member role for create', async () => {
    organizationsService.requireMembership.mockResolvedValue({
      membership: { role: 'member' },
      organization: { id: 'org-1' },
    });
    await expect(service.create('user-2', 'org-1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('revoke is idempotent when already revoked', async () => {
    const revokedAt = new Date('2026-02-01T00:00:00.000Z');
    repository.findByIdInOrganization.mockResolvedValue({
      id: 'key-1',
      organizationId: 'org-1',
      name: 'Default',
      keyPrefix: 'pk_live_AbCd…wxyz',
      keyHash: 'abc',
      createdById: 'user-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      lastUsedAt: null,
      revokedAt,
      updatedAt: revokedAt,
    });

    const result = await service.revoke('user-1', 'org-1', 'key-1');
    expect(result.revokedAt).toBe(revokedAt.toISOString());
    expect(repository.revoke).not.toHaveBeenCalled();
  });

  it('revoke throws when key missing', async () => {
    repository.findByIdInOrganization.mockResolvedValue(null);
    await expect(service.revoke('user-1', 'org-1', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('verifyRawKey accepts active hashed key', async () => {
    const raw = hasher.generateRawKey();
    const keyHash = hasher.hash(raw);
    repository.findActiveByHash.mockResolvedValue({
      id: 'key-1',
      organizationId: 'org-1',
      keyHash,
      revokedAt: null,
    });

    await expect(service.verifyRawKey(raw)).resolves.toEqual({
      keyId: 'key-1',
      organizationId: 'org-1',
    });
  });

  it('verifyRawKey rejects bad format and unknown keys uniformly', async () => {
    await expect(service.verifyRawKey('sk_live_nope')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    repository.findActiveByHash.mockResolvedValue(null);
    const raw = hasher.generateRawKey();
    await expect(service.verifyRawKey(raw)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('verifyRawKey rejects when stored hash does not match', async () => {
    const raw = hasher.generateRawKey();
    repository.findActiveByHash.mockResolvedValue({
      id: 'key-1',
      organizationId: 'org-1',
      keyHash: 'deadbeef',
      revokedAt: null,
    });

    await expect(service.verifyRawKey(raw)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('verifyRawKey rejects null and empty keys', async () => {
    await expect(service.verifyRawKey(null)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(service.verifyRawKey('')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('revoke updates active key and returns dto', async () => {
    const revokedAt = new Date('2026-02-01T00:00:00.000Z');
    repository.findByIdInOrganization.mockResolvedValue({
      id: 'key-1',
      organizationId: 'org-1',
      name: 'Default',
      keyPrefix: 'pk_live_AbCd…wxyz',
      keyHash: 'abc',
      createdById: 'user-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      lastUsedAt: null,
      revokedAt: null,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    repository.revoke.mockResolvedValue({
      id: 'key-1',
      organizationId: 'org-1',
      name: 'Default',
      keyPrefix: 'pk_live_AbCd…wxyz',
      keyHash: 'abc',
      createdById: 'user-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      lastUsedAt: null,
      revokedAt,
      updatedAt: revokedAt,
    });

    const result = await service.revoke('user-1', 'org-1', 'key-1');

    expect(repository.revoke).toHaveBeenCalledWith('key-1');
    expect(result.revokedAt).toBe(revokedAt.toISOString());
  });

  it('create uses trimmed custom name', async () => {
    repository.create.mockImplementation(async (data: { name: string }) => ({
      id: 'key-1',
      organizationId: 'org-1',
      name: data.name,
      keyPrefix: 'pk_live_AbCd…wxyz',
      keyHash: 'abc',
      createdById: 'user-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      lastUsedAt: null,
      revokedAt: null,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    }));

    const created = await service.create('user-1', 'org-1', '  Widget Key  ');
    expect(created.name).toBe('Widget Key');
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Widget Key' }),
    );
  });

  it('markUsed touches lastUsed and swallows repository errors', async () => {
    repository.touchLastUsed.mockResolvedValue(undefined);
    await expect(service.markUsed('key-1')).resolves.toBeUndefined();
    expect(repository.touchLastUsed).toHaveBeenCalledWith('key-1');

    repository.touchLastUsed.mockRejectedValue(new Error('db down'));
    await expect(service.markUsed('key-1')).resolves.toBeUndefined();
  });

  it('rejects member role for list and revoke', async () => {
    organizationsService.requireMembership.mockResolvedValue({
      membership: { role: 'member' },
      organization: { id: 'org-1' },
    });

    await expect(service.list('user-2', 'org-1')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.revoke('user-2', 'org-1', 'key-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
