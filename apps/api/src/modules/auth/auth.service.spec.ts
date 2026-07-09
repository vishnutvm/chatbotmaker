import { ConflictException, UnauthorizedException } from '@nestjs/common';
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
    } as unknown as jest.Mocked<UsersRepository>;

    organizationsRepository = {
      createWithOwner: jest.fn(),
      findMembershipsForUser: jest.fn(),
      findOrganizationById: jest.fn(),
      findMembership: jest.fn(),
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
});
