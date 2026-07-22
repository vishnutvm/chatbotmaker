import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { OrganizationRole, PublishableApiKey } from '@prisma/client';
import type { PublicKeyCreatedDto, PublicKeyDto } from '@genie/types';
import { OrganizationsService } from '../organizations/organizations.service';
import { PublishableKeyHasher } from './publishable-key.hasher';
import { PublishableKeysRepository } from './publishable-keys.repository';

const MANAGER_ROLES: OrganizationRole[] = ['owner', 'admin'];

export type VerifiedPublishableKey = {
  keyId: string;
  organizationId: string;
};

@Injectable()
export class PublishableKeysService {
  constructor(
    private readonly repository: PublishableKeysRepository,
    private readonly hasher: PublishableKeyHasher,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async create(
    userId: string,
    organizationId: string,
    name?: string,
  ): Promise<PublicKeyCreatedDto> {
    await this.requireManager(userId, organizationId);

    const rawKey = this.hasher.generateRawKey();
    const record = await this.repository.create({
      organizationId,
      name: name?.trim() || 'Default',
      keyPrefix: this.hasher.toDisplayPrefix(rawKey),
      keyHash: this.hasher.hash(rawKey),
      createdById: userId,
    });

    return { ...this.toDto(record), key: rawKey };
  }

  async list(userId: string, organizationId: string): Promise<{ keys: PublicKeyDto[] }> {
    await this.requireManager(userId, organizationId);
    const rows = await this.repository.findManyByOrganization(organizationId);
    return { keys: rows.map((r) => this.toDto(r)) };
  }

  async revoke(
    userId: string,
    organizationId: string,
    keyId: string,
  ): Promise<PublicKeyDto> {
    await this.requireManager(userId, organizationId);
    const existing = await this.repository.findByIdInOrganization(organizationId, keyId);
    if (!existing) {
      throw new NotFoundException('Public key not found');
    }
    if (existing.revokedAt) {
      return this.toDto(existing);
    }
    const revoked = await this.repository.revoke(existing.id);
    return this.toDto(revoked);
  }

  /**
   * Resolve an active publishable key from plaintext. Throws 401 on any failure
   * (unknown, revoked, bad format) — uniform error surface.
   */
  async verifyRawKey(rawKey: string | undefined | null): Promise<VerifiedPublishableKey> {
    if (!rawKey || !this.hasher.isValidFormat(rawKey)) {
      throw new UnauthorizedException('Invalid public key');
    }

    const keyHash = this.hasher.hash(rawKey);
    const record = await this.repository.findActiveByHash(keyHash);
    if (!record || !this.hasher.hashesEqual(record.keyHash, keyHash)) {
      throw new UnauthorizedException('Invalid public key');
    }

    return { keyId: record.id, organizationId: record.organizationId };
  }

  async markUsed(keyId: string): Promise<void> {
    try {
      await this.repository.touchLastUsed(keyId);
    } catch {
      // Best-effort — do not fail bootstrap on lastUsed write.
    }
  }

  private async requireManager(userId: string, organizationId: string): Promise<void> {
    const { membership } = await this.organizationsService.requireMembership(
      userId,
      organizationId,
    );
    if (!MANAGER_ROLES.includes(membership.role)) {
      throw new ForbiddenException('Owner or admin role required');
    }
  }

  private toDto(row: PublishableApiKey): PublicKeyDto {
    return {
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      keyPrefix: row.keyPrefix,
      createdById: row.createdById,
      createdAt: row.createdAt.toISOString(),
      lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
      revokedAt: row.revokedAt?.toISOString() ?? null,
    };
  }
}
