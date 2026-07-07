import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { randomUUID } from 'crypto';
import type { AuthResponse, MeResponse, OrganizationRole } from '@genie/types';
import { getJwtSecrets } from '../../config/env';
import type { AccessTokenPayload, RefreshTokenPayload } from '../../common/types/jwt-payload';
import { CACHE_PROVIDER, type CacheProvider } from '../../infrastructure/cache/cache.interface';
import { OrganizationsRepository } from '../organizations/organizations.repository';
import { UsersRepository } from '../users/users.repository';
import type { LoginDto, RefreshTokenDto, SignupDto } from './dto/auth.dto';
import { slugifyOrganizationName } from './utils/slug.util';

const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;
const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly jwtSecrets = getJwtSecrets();

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly jwtService: JwtService,
    @Inject(CACHE_PROVIDER) private readonly cache: CacheProvider,
  ) {}

  async signup(dto: SignupDto): Promise<AuthResponse> {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.usersRepository.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      name: dto.name.trim(),
    });

    const orgName = dto.organizationName?.trim() || `${dto.name.trim()}'s Workspace`;
    const { organization, membership } = await this.organizationsRepository.createWithOwner({
      name: orgName,
      slug: slugifyOrganizationName(orgName),
      ownerId: user._id,
    });

    return this.buildAuthResponse(user, organization, membership.role as OrganizationRole);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const memberships = await this.organizationsRepository.findMembershipsForUser(
      user._id.toString(),
    );
    const primary = memberships[0];
    if (!primary) {
      throw new UnauthorizedException('No organization found for user');
    }

    const organization = await this.organizationsRepository.findOrganizationById(
      primary.organizationId.toString(),
    );
    if (!organization) {
      throw new UnauthorizedException('Organization not found');
    }

    return this.buildAuthResponse(user, organization, primary.role as OrganizationRole);
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthResponse> {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(dto.refreshToken, {
        secret: this.jwtSecrets.refresh,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const cacheKey = `refresh:${payload.sub}:${payload.jti}`;
    const stored = await this.cache.get<string>(cacheKey);
    if (!stored) {
      throw new UnauthorizedException('Refresh token revoked or expired');
    }

    const user = await this.usersRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const memberships = await this.organizationsRepository.findMembershipsForUser(
      user._id.toString(),
    );
    const primary = memberships[0];
    if (!primary) {
      throw new UnauthorizedException('No organization found for user');
    }

    const organization = await this.organizationsRepository.findOrganizationById(
      primary.organizationId.toString(),
    );
    if (!organization) {
      throw new UnauthorizedException('Organization not found');
    }

    await this.cache.del(cacheKey);

    return this.buildAuthResponse(user, organization, primary.role as OrganizationRole);
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.jwtSecrets.refresh,
      });
      if (payload.sub === userId && payload.jti) {
        await this.cache.del(`refresh:${payload.sub}:${payload.jti}`);
      }
    } catch {
      // Ignore invalid token on logout
    }
  }

  async getMe(userId: string): Promise<MeResponse> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const memberships = await this.organizationsRepository.findMembershipsForUser(userId);
    const organizations = await Promise.all(
      memberships.map(async (m) => {
        const org = await this.organizationsRepository.findOrganizationById(
          m.organizationId.toString(),
        );
        if (!org) return null;
        return {
          id: org._id.toString(),
          name: org.name,
          slug: org.slug,
          role: m.role as OrganizationRole,
        };
      }),
    );

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      organizations: organizations.filter((o): o is NonNullable<typeof o> => o !== null),
    };
  }

  private async buildAuthResponse(
    user: { _id: { toString(): string }; email: string; name: string },
    organization: { _id: { toString(): string }; name: string; slug: string },
    role: OrganizationRole,
  ): Promise<AuthResponse> {
    const accessPayload: AccessTokenPayload = {
      sub: user._id.toString(),
      email: user.email,
      organizationId: organization._id.toString(),
      role,
      type: 'access',
    };

    const jti = randomUUID();
    const refreshPayload: RefreshTokenPayload = {
      sub: user._id.toString(),
      type: 'refresh',
      jti,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.jwtSecrets.access,
        expiresIn: ACCESS_TTL_SECONDS,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.jwtSecrets.refresh,
        expiresIn: REFRESH_TTL_SECONDS,
      }),
    ]);

    await this.cache.set(`refresh:${user._id.toString()}:${jti}`, '1', REFRESH_TTL_SECONDS);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      organization: {
        id: organization._id.toString(),
        name: organization.name,
        slug: organization.slug,
        role,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: ACCESS_TTL_SECONDS,
      },
    };
  }
}
