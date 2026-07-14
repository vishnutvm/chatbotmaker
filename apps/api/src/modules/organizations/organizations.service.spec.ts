import { ForbiddenException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import type { OrganizationsRepository } from './organizations.repository';
import type { UsersRepository } from '../users/users.repository';

describe('OrganizationsService', () => {
  const org = {
    id: 'org-1',
    name: 'Acme',
    slug: 'acme-abc',
    ownerId: 'user-1',
    plan: 'free',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };

  let organizationsRepository: jest.Mocked<OrganizationsRepository>;
  let usersRepository: jest.Mocked<UsersRepository>;
  let service: OrganizationsService;

  beforeEach(() => {
    organizationsRepository = {
      findMembershipsWithOrganizations: jest.fn(),
      createWithOwner: jest.fn(),
      findOrganizationById: jest.fn(),
      findMembership: jest.fn(),
      findMembers: jest.fn(),
      updateOrganizationName: jest.fn(),
      createMembership: jest.fn(),
      updateMemberRole: jest.fn(),
      deleteMembership: jest.fn(),
      countOwners: jest.fn(),
      findPendingInvitationByEmail: jest.fn(),
      findInvitationByToken: jest.fn(),
      listPendingInvitations: jest.fn(),
      createInvitation: jest.fn(),
      updateInvitationStatus: jest.fn(),
    } as unknown as jest.Mocked<OrganizationsRepository>;

    usersRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<UsersRepository>;

    service = new OrganizationsService(organizationsRepository, usersRepository);
  });

  it('lists organizations for the user', async () => {
    organizationsRepository.findMembershipsWithOrganizations.mockResolvedValue([
      {
        id: 'm1',
        userId: 'user-1',
        organizationId: 'org-1',
        role: 'owner',
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
        organization: org,
      },
    ] as never);

    const result = await service.listForUser('user-1');
    expect(result.organizations).toHaveLength(1);
    expect(result.organizations[0].role).toBe('owner');
    expect(result.organizations[0].plan).toBe('free');
  });

  it('forbids non-members from reading an organization', async () => {
    organizationsRepository.findOrganizationById.mockResolvedValue(org as never);
    organizationsRepository.findMembership.mockResolvedValue(null);

    await expect(service.getForUser('user-2', 'org-1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('forbids members from updating organization name', async () => {
    organizationsRepository.findOrganizationById.mockResolvedValue(org as never);
    organizationsRepository.findMembership.mockResolvedValue({
      id: 'm2',
      userId: 'user-2',
      organizationId: 'org-1',
      role: 'member',
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    } as never);

    await expect(
      service.updateForUser('user-2', 'org-1', { name: 'New' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows admins to update organization name', async () => {
    organizationsRepository.findOrganizationById.mockResolvedValue(org as never);
    organizationsRepository.findMembership.mockResolvedValue({
      id: 'm2',
      userId: 'user-2',
      organizationId: 'org-1',
      role: 'admin',
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    } as never);
    organizationsRepository.updateOrganizationName.mockResolvedValue({
      ...org,
      name: 'New',
    } as never);

    const result = await service.updateForUser('user-2', 'org-1', { name: 'New' });
    expect(result.name).toBe('New');
    expect(result.role).toBe('admin');
  });

  it('creates a pending invitation when email is unknown', async () => {
    organizationsRepository.findOrganizationById.mockResolvedValue(org as never);
    organizationsRepository.findMembership.mockResolvedValue({
      id: 'm1',
      userId: 'user-1',
      organizationId: 'org-1',
      role: 'owner',
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    } as never);
    usersRepository.findByEmail.mockResolvedValue(null);
    organizationsRepository.findPendingInvitationByEmail.mockResolvedValue(null);
    organizationsRepository.createInvitation.mockResolvedValue({
      id: 'inv-1',
      organizationId: 'org-1',
      email: 'missing@example.com',
      role: 'member',
      token: 'a'.repeat(32),
      invitedById: 'user-1',
      status: 'pending',
      expiresAt: new Date(Date.now() + 86_400_000),
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    } as never);

    const result = await service.inviteMember('user-1', 'org-1', { email: 'missing@example.com' });
    expect(result.status).toBe('invited');
    if (result.status === 'invited') {
      expect(result.invitation.email).toBe('missing@example.com');
      expect(result.invitation.inviteUrl).toContain('/invite/');
    }
  });

  it('blocks removing the sole owner', async () => {
    organizationsRepository.findOrganizationById.mockResolvedValue(org as never);
    organizationsRepository.findMembership
      .mockResolvedValueOnce({
        id: 'm1',
        userId: 'user-1',
        organizationId: 'org-1',
        role: 'owner',
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
      } as never)
      .mockResolvedValueOnce({
        id: 'm1',
        userId: 'user-1',
        organizationId: 'org-1',
        role: 'owner',
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
      } as never);
    organizationsRepository.countOwners.mockResolvedValue(1);

    await expect(service.removeMember('user-1', 'org-1', 'user-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
