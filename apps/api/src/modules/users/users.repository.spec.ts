import type { PrismaService } from '../../infrastructure/database/prisma.service';
import { UsersRepository } from './users.repository';

describe('UsersRepository', () => {
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    organization: {
      findMany: jest.Mock;
      deleteMany: jest.Mock;
    };
    organizationMember: {
      deleteMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let repository: UsersRepository;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      organization: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      organizationMember: {
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    repository = new UsersRepository(prisma as unknown as PrismaService);
  });

  it('findByEmail lowercases the email', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await repository.findByEmail('Ada@Example.COM');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'ada@example.com' },
    });
  });

  it('findById and findBySupabaseUserId delegate to prisma', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    await expect(repository.findById('u1')).resolves.toEqual({ id: 'u1' });
    await repository.findBySupabaseUserId('sup-1');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { supabaseUserId: 'sup-1' } });
  });

  it('create lowercases email, trims name, defaults emailVerified', async () => {
    prisma.user.create.mockResolvedValue({ id: 'u1' });
    await repository.create({
      supabaseUserId: 'sup-1',
      email: 'Ada@Example.COM',
      name: '  Ada  ',
    });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        supabaseUserId: 'sup-1',
        email: 'ada@example.com',
        name: 'Ada',
        emailVerified: false,
      },
    });
  });

  it('create respects explicit emailVerified', async () => {
    prisma.user.create.mockResolvedValue({ id: 'u1' });
    await repository.create({
      supabaseUserId: 'sup-1',
      email: 'a@b.com',
      name: 'A',
      emailVerified: true,
    });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ emailVerified: true }),
    });
  });

  it('updateName trims the name', async () => {
    prisma.user.update.mockResolvedValue({ id: 'u1', name: 'Ada' });
    await repository.updateName('u1', '  Ada  ');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { name: 'Ada' },
    });
  });

  it('deleteAccountCascade removes owned orgs then memberships then user', async () => {
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<void>) =>
      fn(prisma),
    );
    prisma.organization.findMany.mockResolvedValue([{ id: 'org-1' }, { id: 'org-2' }]);
    prisma.organizationMember.deleteMany.mockResolvedValue({ count: 1 });
    prisma.organization.deleteMany.mockResolvedValue({ count: 2 });
    prisma.user.delete.mockResolvedValue({ id: 'u1' });

    await repository.deleteAccountCascade('u1');

    expect(prisma.organizationMember.deleteMany).toHaveBeenCalledWith({
      where: { organizationId: { in: ['org-1', 'org-2'] } },
    });
    expect(prisma.organization.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['org-1', 'org-2'] } },
    });
    expect(prisma.organizationMember.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
    });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });

  it('deleteAccountCascade skips org deletes when user owns none', async () => {
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<void>) =>
      fn(prisma),
    );
    prisma.organization.findMany.mockResolvedValue([]);
    prisma.organizationMember.deleteMany.mockResolvedValue({ count: 0 });
    prisma.user.delete.mockResolvedValue({ id: 'u1' });

    await repository.deleteAccountCascade('u1');

    expect(prisma.organization.deleteMany).not.toHaveBeenCalled();
    expect(prisma.organizationMember.deleteMany).toHaveBeenCalledTimes(1);
    expect(prisma.organizationMember.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
    });
  });
});
