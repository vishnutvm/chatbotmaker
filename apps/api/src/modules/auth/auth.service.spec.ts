import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { OrganizationsRepository } from '../organizations/organizations.repository';
import type { UsersRepository } from '../users/users.repository';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let organizationsRepository: jest.Mocked<OrganizationsRepository>;

  beforeEach(() => {
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
});
