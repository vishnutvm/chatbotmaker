import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { OrganizationsRepository } from '../organizations/organizations.repository';
import type { UsersRepository } from '../users/users.repository';

const mockDeleteUser = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      admin: {
        deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
      },
    },
  })),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let organizationsRepository: jest.Mocked<OrganizationsRepository>;
  const originalSupabaseUrl = process.env.SUPABASE_URL;
  const originalServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  beforeEach(() => {
    mockDeleteUser.mockReset();
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test';

    usersRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findBySupabaseUserId: jest.fn(),
      create: jest.fn(),
      updateName: jest.fn(),
      deleteAccountCascade: jest.fn(),
    } as unknown as jest.Mocked<UsersRepository>;

    organizationsRepository = {
      createWithOwner: jest.fn(),
      findMembershipsForUser: jest.fn(),
      findOrganizationById: jest.fn(),
      findMembership: jest.fn(),
      findOrganizationsOwnedByUser: jest.fn(),
      countMembers: jest.fn(),
      toOrganizationRole: jest.fn(),
    } as unknown as jest.Mocked<OrganizationsRepository>;

    service = new AuthService(usersRepository, organizationsRepository);
  });

  afterEach(() => {
    if (originalSupabaseUrl === undefined) {
      delete process.env.SUPABASE_URL;
    } else {
      process.env.SUPABASE_URL = originalSupabaseUrl;
    }
    if (originalServiceRole === undefined) {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    } else {
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRole;
    }
  });

  it('rejects onboard when supabase user already onboarded', async () => {
    usersRepository.findBySupabaseUserId.mockResolvedValue({
      id: 'user-1',
      supabaseUserId: 'sup-1',
      email: 'a@b.com',
      name: 'Test',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      service.onboard(
        { supabaseUserId: 'sup-1', email: 'a@b.com' },
        { name: 'Test' },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects getMe when user not found', async () => {
    usersRepository.findById.mockResolvedValue(null);
    await expect(service.getMe('missing')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('updates profile name and returns me payload', async () => {
    const user = {
      id: 'user-1',
      supabaseUserId: 'sup-1',
      email: 'a@b.com',
      name: 'Old',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    usersRepository.findById
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce({ ...user, name: 'New Name' });
    usersRepository.updateName.mockResolvedValue({ ...user, name: 'New Name' });
    organizationsRepository.findMembershipsForUser.mockResolvedValue([]);

    const result = await service.updateProfile('user-1', { name: 'New Name' });

    expect(usersRepository.updateName).toHaveBeenCalledWith('user-1', 'New Name');
    expect(result.user.name).toBe('New Name');
  });

  it('rejects updateProfile when user not found', async () => {
    usersRepository.findById.mockResolvedValue(null);
    await expect(service.updateProfile('missing', { name: 'X' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects deleteAccount when user not found', async () => {
    usersRepository.findById.mockResolvedValue(null);
    await expect(service.deleteAccount('missing')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects deleteAccount when owned company has other members', async () => {
    usersRepository.findById.mockResolvedValue({
      id: 'user-1',
      supabaseUserId: 'sup-1',
      email: 'a@b.com',
      name: 'Test',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    organizationsRepository.findOrganizationsOwnedByUser.mockResolvedValue([
      {
        id: 'org-1',
        name: 'Co',
        slug: 'co',
        ownerId: 'user-1',
        plan: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    organizationsRepository.countMembers.mockResolvedValue(2);

    await expect(service.deleteAccount('user-1')).rejects.toBeInstanceOf(BadRequestException);
    expect(usersRepository.deleteAccountCascade).not.toHaveBeenCalled();
  });

  it('onboards a new user and creates a default organization', async () => {
    usersRepository.findBySupabaseUserId.mockResolvedValue(null);
    usersRepository.findByEmail.mockResolvedValue(null);
    usersRepository.create.mockResolvedValue({
      id: 'user-1',
      supabaseUserId: 'sup-1',
      email: 'a@b.com',
      name: 'Ada',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    organizationsRepository.createWithOwner.mockResolvedValue({
      organization: {
        id: 'org-1',
        name: "Ada's Company",
        slug: 'adas-company',
        ownerId: 'user-1',
        plan: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      membership: {
        id: 'm1',
        userId: 'user-1',
        organizationId: 'org-1',
        role: 'owner',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    } as never);

    const result = await service.onboard(
      { supabaseUserId: 'sup-1', email: 'a@b.com' },
      { name: 'Ada' },
    );

    expect(result.user.email).toBe('a@b.com');
    expect(result.organization.role).toBe('owner');
    expect(organizationsRepository.createWithOwner).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: 'user-1', name: "Ada's Company" }),
    );
  });

  it('rejects onboard when email is already registered', async () => {
    usersRepository.findBySupabaseUserId.mockResolvedValue(null);
    usersRepository.findByEmail.mockResolvedValue({
      id: 'other',
      supabaseUserId: 'sup-other',
      email: 'a@b.com',
      name: 'Other',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      service.onboard({ supabaseUserId: 'sup-1', email: 'a@b.com' }, { name: 'Ada' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('getMe filters out memberships whose organization is missing', async () => {
    usersRepository.findById.mockResolvedValue({
      id: 'user-1',
      supabaseUserId: 'sup-1',
      email: 'a@b.com',
      name: 'Ada',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    organizationsRepository.findMembershipsForUser.mockResolvedValue([
      {
        id: 'm1',
        userId: 'user-1',
        organizationId: 'org-1',
        role: 'owner',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'm2',
        userId: 'user-1',
        organizationId: 'org-missing',
        role: 'member',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as never);
    organizationsRepository.findOrganizationById
      .mockResolvedValueOnce({
        id: 'org-1',
        name: 'Acme',
        slug: 'acme',
        ownerId: 'user-1',
        plan: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)
      .mockResolvedValueOnce(null);

    const me = await service.getMe('user-1');
    expect(me.organizations).toHaveLength(1);
    expect(me.organizations[0].id).toBe('org-1');
  });

  it('deleteAccount removes auth user then cascades app rows', async () => {
    usersRepository.findById.mockResolvedValue({
      id: 'user-1',
      supabaseUserId: 'sup-1',
      email: 'a@b.com',
      name: 'Ada',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    organizationsRepository.findOrganizationsOwnedByUser.mockResolvedValue([
      {
        id: 'org-1',
        name: 'Co',
        slug: 'co',
        ownerId: 'user-1',
        plan: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as never);
    organizationsRepository.countMembers.mockResolvedValue(1);
    mockDeleteUser.mockResolvedValue({ error: null });
    usersRepository.deleteAccountCascade.mockResolvedValue(undefined);

    await service.deleteAccount('user-1');

    expect(mockDeleteUser).toHaveBeenCalledWith('sup-1');
    expect(usersRepository.deleteAccountCascade).toHaveBeenCalledWith('user-1');
  });

  it('deleteAccount fails closed when Supabase auth delete fails', async () => {
    usersRepository.findById.mockResolvedValue({
      id: 'user-1',
      supabaseUserId: 'sup-1',
      email: 'a@b.com',
      name: 'Ada',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    organizationsRepository.findOrganizationsOwnedByUser.mockResolvedValue([]);
    mockDeleteUser.mockResolvedValue({ error: { message: 'auth down' } });

    await expect(service.deleteAccount('user-1')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    expect(usersRepository.deleteAccountCascade).not.toHaveBeenCalled();
  });

  it('deleteAccount reports cascade failure after auth delete succeeds', async () => {
    usersRepository.findById.mockResolvedValue({
      id: 'user-1',
      supabaseUserId: 'sup-1',
      email: 'a@b.com',
      name: 'Ada',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    organizationsRepository.findOrganizationsOwnedByUser.mockResolvedValue([]);
    mockDeleteUser.mockResolvedValue({ error: null });
    usersRepository.deleteAccountCascade.mockRejectedValue(new Error('db cascade failed'));

    await expect(service.deleteAccount('user-1')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('resolveAuthenticatedUser maps onboarded users', async () => {
    usersRepository.findBySupabaseUserId.mockResolvedValue({
      id: 'user-1',
      supabaseUserId: 'sup-1',
      email: 'a@b.com',
      name: 'Ada',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(service.resolveAuthenticatedUser('sup-1')).resolves.toEqual({
      supabaseUserId: 'sup-1',
      userId: 'user-1',
      email: 'a@b.com',
    });
  });

  it('resolveAuthenticatedUser rejects users who are not onboarded', async () => {
    usersRepository.findBySupabaseUserId.mockResolvedValue(null);
    await expect(service.resolveAuthenticatedUser('sup-1', 'x@y.com')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
