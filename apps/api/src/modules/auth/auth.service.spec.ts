import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import type { CacheProvider } from '../../infrastructure/cache/cache.interface';
import type { OrganizationsRepository } from '../organizations/organizations.repository';
import type { UsersRepository } from '../users/users.repository';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let organizationsRepository: jest.Mocked<OrganizationsRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let cache: jest.Mocked<CacheProvider>;

  beforeEach(() => {
    usersRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<UsersRepository>;

    organizationsRepository = {
      createWithOwner: jest.fn(),
      findMembershipsForUser: jest.fn(),
      findOrganizationById: jest.fn(),
    } as unknown as jest.Mocked<OrganizationsRepository>;

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('token'),
      verifyAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    cache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    service = new AuthService(usersRepository, organizationsRepository, jwtService, cache);
  });

  it('rejects signup when email exists', async () => {
    usersRepository.findByEmail.mockResolvedValue({ _id: '1' } as never);
    await expect(
      service.signup({ email: 'a@b.com', password: 'password1', name: 'Test' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects login with invalid password', async () => {
    usersRepository.findByEmail.mockResolvedValue({
      _id: { toString: () => 'user1' },
      passwordHash: '$2a$12$abcdefghijklmnopqrstuv', // bcrypt hash placeholder
      email: 'a@b.com',
      name: 'Test',
    } as never);

    await expect(
      service.login({ email: 'a@b.com', password: 'wrongpass' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
