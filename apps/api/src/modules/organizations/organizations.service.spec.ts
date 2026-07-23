import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
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

  const ownerMembership = {
    id: 'm1',
    userId: 'user-1',
    organizationId: 'org-1',
    role: 'owner' as const,
    createdAt: org.createdAt,
    updatedAt: org.updatedAt,
    organization: org,
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
      findMembershipWithOrganization: jest.fn(),
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

  function mockOwnerMembership() {
    organizationsRepository.findMembershipWithOrganization.mockResolvedValue(
      ownerMembership as never,
    );
  }

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
    organizationsRepository.findMembershipWithOrganization.mockResolvedValue(null);
    organizationsRepository.findOrganizationById.mockResolvedValue(org as never);

    await expect(service.getForUser('user-2', 'org-1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('forbids members from updating organization name', async () => {
    organizationsRepository.findMembershipWithOrganization.mockResolvedValue({
      id: 'm2',
      userId: 'user-2',
      organizationId: 'org-1',
      role: 'member',
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      organization: org,
    } as never);

    await expect(
      service.updateForUser('user-2', 'org-1', { name: 'New' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requireManagerMembership allows owner and rejects member', async () => {
    organizationsRepository.findMembershipWithOrganization.mockResolvedValue(
      ownerMembership as never,
    );
    await expect(service.requireManagerMembership('user-1', 'org-1')).resolves.toMatchObject({
      membership: { role: 'owner' },
    });

    organizationsRepository.findMembershipWithOrganization.mockResolvedValue({
      id: 'm2',
      userId: 'user-2',
      organizationId: 'org-1',
      role: 'member',
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      organization: org,
    } as never);

    await expect(service.requireManagerMembership('user-2', 'org-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows admins to update organization name', async () => {
    organizationsRepository.findMembershipWithOrganization.mockResolvedValue({
      id: 'm2',
      userId: 'user-2',
      organizationId: 'org-1',
      role: 'admin',
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      organization: org,
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
    organizationsRepository.findMembershipWithOrganization.mockResolvedValue({
      id: 'm1',
      userId: 'user-1',
      organizationId: 'org-1',
      role: 'owner',
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      organization: org,
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
    organizationsRepository.findMembershipWithOrganization.mockResolvedValue({
      id: 'm1',
      userId: 'user-1',
      organizationId: 'org-1',
      role: 'owner',
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      organization: org,
    } as never);
    organizationsRepository.findMembership.mockResolvedValue({
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

  it('creates an organization for the user', async () => {
    organizationsRepository.createWithOwner.mockResolvedValue({
      organization: org,
      membership: {
        id: 'm1',
        userId: 'user-1',
        organizationId: 'org-1',
        role: 'owner',
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
      },
    } as never);

    const result = await service.create('user-1', { name: '  Acme  ' });
    expect(result.id).toBe('org-1');
    expect(result.role).toBe('owner');
    expect(organizationsRepository.createWithOwner).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Acme', ownerId: 'user-1' }),
    );
  });

  it('returns organization detail for members', async () => {
    mockOwnerMembership();
    const result = await service.getForUser('user-1', 'org-1');
    expect(result.ownerId).toBe('user-1');
    expect(result.updatedAt).toBe(org.updatedAt.toISOString());
  });

  it('rejects blank organization name updates', async () => {
    mockOwnerMembership();
    await expect(service.updateForUser('user-1', 'org-1', { name: '   ' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('lists members for the organization', async () => {
    mockOwnerMembership();
    organizationsRepository.findMembers.mockResolvedValue([
      {
        id: 'm1',
        userId: 'user-1',
        organizationId: 'org-1',
        role: 'owner',
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
        user: { id: 'user-1', email: 'a@b.com', name: 'Ada' },
      },
    ] as never);

    const result = await service.listMembers('user-1', 'org-1');
    expect(result.members).toEqual([
      {
        userId: 'user-1',
        email: 'a@b.com',
        name: 'Ada',
        role: 'owner',
        createdAt: org.createdAt.toISOString(),
      },
    ]);
  });

  it('adds an onboarded user immediately and accepts pending invite', async () => {
    mockOwnerMembership();
    usersRepository.findByEmail.mockResolvedValue({
      id: 'user-2',
      supabaseUserId: 'sup-2',
      email: 'b@c.com',
      name: 'Bob',
      emailVerified: true,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    } as never);
    organizationsRepository.findMembership.mockResolvedValue(null);
    organizationsRepository.createMembership.mockResolvedValue({
      id: 'm2',
      userId: 'user-2',
      organizationId: 'org-1',
      role: 'member',
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    } as never);
    organizationsRepository.findPendingInvitationByEmail.mockResolvedValue({
      id: 'inv-1',
      organizationId: 'org-1',
      email: 'b@c.com',
      role: 'member',
      token: 'tok',
      invitedById: 'user-1',
      status: 'pending',
      expiresAt: new Date(Date.now() + 86_400_000),
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    } as never);

    const result = await service.inviteMember('user-1', 'org-1', { email: 'B@C.com', role: 'member' });
    expect(result.status).toBe('added');
    expect(organizationsRepository.updateInvitationStatus).toHaveBeenCalledWith('inv-1', 'accepted');
    if (result.status === 'added') {
      expect(result.member.email).toBe('b@c.com');
    }
  });

  it('rejects inviting an existing member', async () => {
    mockOwnerMembership();
    usersRepository.findByEmail.mockResolvedValue({
      id: 'user-2',
      email: 'b@c.com',
      name: 'Bob',
    } as never);
    organizationsRepository.findMembership.mockResolvedValue({
      id: 'm2',
      userId: 'user-2',
      organizationId: 'org-1',
      role: 'member',
    } as never);

    await expect(
      service.inviteMember('user-1', 'org-1', { email: 'b@c.com' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects duplicate pending invitations', async () => {
    mockOwnerMembership();
    usersRepository.findByEmail.mockResolvedValue(null);
    organizationsRepository.findPendingInvitationByEmail.mockResolvedValue({
      id: 'inv-1',
    } as never);

    await expect(
      service.inviteMember('user-1', 'org-1', { email: 'new@example.com' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('addMember aliases inviteMember', async () => {
    mockOwnerMembership();
    usersRepository.findByEmail.mockResolvedValue(null);
    organizationsRepository.findPendingInvitationByEmail.mockResolvedValue(null);
    organizationsRepository.createInvitation.mockResolvedValue({
      id: 'inv-1',
      organizationId: 'org-1',
      email: 'new@example.com',
      role: 'member',
      token: 'a'.repeat(32),
      invitedById: 'user-1',
      status: 'pending',
      expiresAt: new Date(Date.now() + 86_400_000),
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    } as never);

    const result = await service.addMember('user-1', 'org-1', { email: 'new@example.com' });
    expect(result.status).toBe('invited');
  });

  it('lists and revokes invitations for managers', async () => {
    mockOwnerMembership();
    const invitation = {
      id: 'inv-1',
      organizationId: 'org-1',
      email: 'new@example.com',
      role: 'member',
      token: 'tok',
      invitedById: 'user-1',
      status: 'pending',
      expiresAt: new Date(Date.now() + 86_400_000),
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    };
    organizationsRepository.listPendingInvitations.mockResolvedValue([invitation] as never);

    const listed = await service.listInvitations('user-1', 'org-1');
    expect(listed.invitations).toHaveLength(1);

    await service.revokeInvitation('user-1', 'org-1', 'inv-1');
    expect(organizationsRepository.updateInvitationStatus).toHaveBeenCalledWith('inv-1', 'revoked');
  });

  it('throws when revoking a missing invitation', async () => {
    mockOwnerMembership();
    organizationsRepository.listPendingInvitations.mockResolvedValue([]);
    await expect(service.revokeInvitation('user-1', 'org-1', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('accepts a valid invitation for a matching email', async () => {
    organizationsRepository.findInvitationByToken.mockResolvedValue({
      id: 'inv-1',
      organizationId: 'org-1',
      email: 'a@b.com',
      role: 'member',
      token: 'tok',
      invitedById: 'user-2',
      status: 'pending',
      expiresAt: new Date(Date.now() + 86_400_000),
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    } as never);
    usersRepository.findById.mockResolvedValue({
      id: 'user-1',
      email: 'A@B.com',
      name: 'Ada',
    } as never);
    organizationsRepository.findMembership.mockResolvedValue(null);
    organizationsRepository.createMembership.mockResolvedValue({
      id: 'm2',
      userId: 'user-1',
      organizationId: 'org-1',
      role: 'member',
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    } as never);

    const result = await service.acceptInvitation('user-1', 'tok');
    expect(result.role).toBe('member');
    expect(organizationsRepository.updateInvitationStatus).toHaveBeenCalledWith('inv-1', 'accepted');
  });

  it('acceptInvitation returns existing membership when already a member', async () => {
    organizationsRepository.findInvitationByToken.mockResolvedValue({
      id: 'inv-1',
      organizationId: 'org-1',
      email: 'a@b.com',
      role: 'member',
      status: 'pending',
      expiresAt: new Date(Date.now() + 86_400_000),
    } as never);
    usersRepository.findById.mockResolvedValue({
      id: 'user-1',
      email: 'a@b.com',
      name: 'Ada',
    } as never);
    organizationsRepository.findMembership.mockResolvedValue({
      id: 'm1',
      userId: 'user-1',
      organizationId: 'org-1',
      role: 'admin',
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    } as never);

    const result = await service.acceptInvitation('user-1', 'tok');
    expect(result.role).toBe('admin');
    expect(organizationsRepository.createMembership).not.toHaveBeenCalled();
  });

  it('rejects expired, mismatched, and invalid invitations', async () => {
    organizationsRepository.findInvitationByToken.mockResolvedValue(null);
    await expect(service.acceptInvitation('user-1', 'bad')).rejects.toBeInstanceOf(NotFoundException);

    organizationsRepository.findInvitationByToken.mockResolvedValue({
      id: 'inv-1',
      email: 'a@b.com',
      role: 'member',
      status: 'pending',
      expiresAt: new Date(Date.now() - 1000),
    } as never);
    await expect(service.acceptInvitation('user-1', 'tok')).rejects.toBeInstanceOf(BadRequestException);

    organizationsRepository.findInvitationByToken.mockResolvedValue({
      id: 'inv-1',
      email: 'a@b.com',
      role: 'member',
      status: 'pending',
      expiresAt: new Date(Date.now() + 86_400_000),
    } as never);
    usersRepository.findById.mockResolvedValue(null);
    await expect(service.acceptInvitation('user-1', 'tok')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    usersRepository.findById.mockResolvedValue({ id: 'user-1', email: 'other@x.com', name: 'X' } as never);
    await expect(service.acceptInvitation('user-1', 'tok')).rejects.toBeInstanceOf(ForbiddenException);

    usersRepository.findById.mockResolvedValue({ id: 'user-1', email: 'a@b.com', name: 'Ada' } as never);
    organizationsRepository.findInvitationByToken.mockResolvedValue({
      id: 'inv-1',
      email: 'a@b.com',
      role: 'owner',
      status: 'pending',
      expiresAt: new Date(Date.now() + 86_400_000),
    } as never);
    await expect(service.acceptInvitation('user-1', 'tok')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates member roles for managers', async () => {
    mockOwnerMembership();
    organizationsRepository.findMembership.mockResolvedValue({
      id: 'm2',
      userId: 'user-2',
      organizationId: 'org-1',
      role: 'member',
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    } as never);
    organizationsRepository.updateMemberRole.mockResolvedValue({
      id: 'm2',
      userId: 'user-2',
      organizationId: 'org-1',
      role: 'admin',
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    } as never);
    usersRepository.findById.mockResolvedValue({
      id: 'user-2',
      email: 'b@c.com',
      name: 'Bob',
    } as never);

    const result = await service.updateMemberRole('user-1', 'org-1', 'user-2', { role: 'admin' });
    expect(result.role).toBe('admin');
  });

  it('forbids changing the owner via updateMemberRole', async () => {
    mockOwnerMembership();
    organizationsRepository.findMembership.mockResolvedValue({
      id: 'm1',
      userId: 'user-1',
      organizationId: 'org-1',
      role: 'owner',
    } as never);

    await expect(
      service.updateMemberRole('user-1', 'org-1', 'user-1', { role: 'admin' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows managers to remove other members', async () => {
    mockOwnerMembership();
    organizationsRepository.findMembership.mockResolvedValue({
      id: 'm2',
      userId: 'user-2',
      organizationId: 'org-1',
      role: 'member',
    } as never);

    await service.removeMember('user-1', 'org-1', 'user-2');
    expect(organizationsRepository.deleteMembership).toHaveBeenCalledWith('org-1', 'user-2');
  });

  it('throws when updating a missing member', async () => {
    mockOwnerMembership();
    organizationsRepository.findMembership.mockResolvedValue(null);
    await expect(
      service.updateMemberRole('user-1', 'org-1', 'missing', { role: 'admin' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when updated member user row is missing', async () => {
    mockOwnerMembership();
    organizationsRepository.findMembership.mockResolvedValue({
      id: 'm2',
      userId: 'user-2',
      organizationId: 'org-1',
      role: 'member',
    } as never);
    organizationsRepository.updateMemberRole.mockResolvedValue({
      id: 'm2',
      userId: 'user-2',
      organizationId: 'org-1',
      role: 'admin',
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    } as never);
    usersRepository.findById.mockResolvedValue(null);

    await expect(
      service.updateMemberRole('user-1', 'org-1', 'user-2', { role: 'admin' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when removing a missing member', async () => {
    mockOwnerMembership();
    organizationsRepository.findMembership.mockResolvedValue(null);
    await expect(service.removeMember('user-1', 'org-1', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws NotFound when organization is missing during membership check', async () => {
    organizationsRepository.findMembershipWithOrganization.mockResolvedValue(null);
    organizationsRepository.findOrganizationById.mockResolvedValue(null);

    await expect(service.getForUser('user-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
