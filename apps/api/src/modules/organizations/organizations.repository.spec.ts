import type { PrismaService } from '../../infrastructure/database/prisma.service';
import { OrganizationsRepository } from './organizations.repository';

describe('OrganizationsRepository', () => {
  let prisma: {
    organization: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
    organizationMember: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
    organizationInvitation: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let repository: OrganizationsRepository;

  beforeEach(() => {
    prisma = {
      organization: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      organizationMember: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      organizationInvitation: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    repository = new OrganizationsRepository(prisma as unknown as PrismaService);
  });

  it('createWithOwner creates org + owner membership in a transaction', async () => {
    const organization = { id: 'org-1', name: 'Acme', slug: 'acme', ownerId: 'u1', plan: 'free' };
    const membership = { id: 'm1', userId: 'u1', organizationId: 'org-1', role: 'owner' };
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) =>
      fn(prisma),
    );
    prisma.organization.create.mockResolvedValue(organization);
    prisma.organizationMember.create.mockResolvedValue(membership);

    const result = await repository.createWithOwner({
      name: 'Acme',
      slug: 'acme',
      ownerId: 'u1',
    });

    expect(result).toEqual({ organization, membership });
    expect(prisma.organization.create).toHaveBeenCalledWith({
      data: { name: 'Acme', slug: 'acme', ownerId: 'u1', plan: 'free' },
    });
    expect(prisma.organizationMember.create).toHaveBeenCalledWith({
      data: { userId: 'u1', organizationId: 'org-1', role: 'owner' },
    });
  });

  it('membership and organization lookups use expected where clauses', async () => {
    prisma.organizationMember.findMany.mockResolvedValue([]);
    prisma.organizationMember.findUnique.mockResolvedValue(null);
    prisma.organization.findUnique.mockResolvedValue(null);
    prisma.organization.findMany.mockResolvedValue([]);
    prisma.organizationMember.count.mockResolvedValue(0);

    await repository.findMembershipsForUser('u1');
    await repository.findMembershipsWithOrganizations('u1');
    await repository.findOrganizationById('org-1');
    await repository.findMembership('u1', 'org-1');
    await repository.findMembershipWithOrganization('u1', 'org-1');
    await repository.findMembers('org-1');
    await repository.findOrganizationsOwnedByUser('u1');
    await repository.countOwners('org-1');
    await repository.countMembers('org-1');
    await repository.countMembershipsForUser('u1');

    expect(prisma.organizationMember.findMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    expect(prisma.organizationMember.findUnique).toHaveBeenCalledWith({
      where: { userId_organizationId: { userId: 'u1', organizationId: 'org-1' } },
      include: { organization: true },
    });
    expect(prisma.organizationMember.count).toHaveBeenCalledWith({
      where: { organizationId: 'org-1', role: 'owner' },
    });
  });

  it('updates name and mutates memberships', async () => {
    prisma.organization.update.mockResolvedValue({ id: 'org-1', name: 'New' });
    prisma.organizationMember.create.mockResolvedValue({ id: 'm2' });
    prisma.organizationMember.update.mockResolvedValue({ id: 'm2', role: 'admin' });
    prisma.organizationMember.delete.mockResolvedValue({ id: 'm2' });

    await repository.updateOrganizationName('org-1', 'New');
    await repository.createMembership('org-1', 'u2', 'member');
    await repository.updateMemberRole('org-1', 'u2', 'admin');
    await repository.deleteMembership('org-1', 'u2');

    expect(prisma.organization.update).toHaveBeenCalledWith({
      where: { id: 'org-1' },
      data: { name: 'New' },
    });
    expect(prisma.organizationMember.create).toHaveBeenCalledWith({
      data: { organizationId: 'org-1', userId: 'u2', role: 'member' },
    });
  });

  it('invitation helpers lowercase email and pass through status updates', async () => {
    prisma.organizationInvitation.findFirst.mockResolvedValue(null);
    prisma.organizationInvitation.findUnique.mockResolvedValue(null);
    prisma.organizationInvitation.findMany.mockResolvedValue([]);
    prisma.organizationInvitation.create.mockResolvedValue({ id: 'inv-1' });
    prisma.organizationInvitation.update.mockResolvedValue({ id: 'inv-1', status: 'revoked' });

    await repository.findPendingInvitationByEmail('org-1', 'Ada@Example.COM');
    await repository.findInvitationByToken('tok');
    await repository.listPendingInvitations('org-1');
    await repository.createInvitation({
      organizationId: 'org-1',
      email: 'Ada@Example.COM',
      role: 'member',
      token: 'tok',
      invitedById: 'u1',
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
    });
    await repository.updateInvitationStatus('inv-1', 'revoked');

    expect(prisma.organizationInvitation.findFirst).toHaveBeenCalledWith({
      where: { organizationId: 'org-1', email: 'ada@example.com', status: 'pending' },
    });
    expect(prisma.organizationInvitation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'ada@example.com',
        status: 'pending',
      }),
    });
  });

  it('toOrganizationRole is identity', () => {
    expect(repository.toOrganizationRole('admin')).toBe('admin');
  });
});
