import { Injectable } from '@nestjs/common';
import type { OrganizationSubscription, Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export type UpsertSubscriptionInput = {
  organizationId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  plan: string;
  status: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  /** When false, update subscription row but do not write organizations.plan (unknown price). */
  syncOrgPlan?: boolean;
};

@Injectable()
export class BillingRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByOrganizationId(organizationId: string): Promise<OrganizationSubscription | null> {
    return this.prisma.organizationSubscription.findUnique({
      where: { organizationId },
    });
  }

  findByStripeCustomerId(stripeCustomerId: string): Promise<OrganizationSubscription | null> {
    return this.prisma.organizationSubscription.findUnique({
      where: { stripeCustomerId },
    });
  }

  findByStripeSubscriptionId(
    stripeSubscriptionId: string,
  ): Promise<OrganizationSubscription | null> {
    return this.prisma.organizationSubscription.findUnique({
      where: { stripeSubscriptionId },
    });
  }

  create(data: {
    organizationId: string;
    stripeCustomerId?: string | null;
    plan?: string;
    status?: string;
  }): Promise<OrganizationSubscription> {
    return this.prisma.organizationSubscription.create({
      data: {
        organizationId: data.organizationId,
        stripeCustomerId: data.stripeCustomerId ?? null,
        plan: data.plan ?? 'free',
        status: data.status ?? 'none',
      },
    });
  }

  updateCustomerId(
    organizationId: string,
    stripeCustomerId: string,
  ): Promise<OrganizationSubscription> {
    return this.prisma.organizationSubscription.update({
      where: { organizationId },
      data: { stripeCustomerId },
    });
  }

  /**
   * Upsert subscription row and sync denormalized `organizations.plan` in one transaction.
   */
  async upsertAndSyncOrgPlan(input: UpsertSubscriptionInput): Promise<OrganizationSubscription> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.organizationSubscription.findUnique({
        where: { organizationId: input.organizationId },
      });

      const data: Prisma.OrganizationSubscriptionUncheckedCreateInput = {
        organizationId: input.organizationId,
        stripeCustomerId: input.stripeCustomerId ?? existing?.stripeCustomerId ?? null,
        stripeSubscriptionId:
          input.stripeSubscriptionId !== undefined
            ? input.stripeSubscriptionId
            : (existing?.stripeSubscriptionId ?? null),
        stripePriceId:
          input.stripePriceId !== undefined
            ? input.stripePriceId
            : (existing?.stripePriceId ?? null),
        plan: input.plan,
        status: input.status,
        cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? existing?.cancelAtPeriodEnd ?? false,
        currentPeriodStart:
          input.currentPeriodStart !== undefined
            ? input.currentPeriodStart
            : (existing?.currentPeriodStart ?? null),
        currentPeriodEnd:
          input.currentPeriodEnd !== undefined
            ? input.currentPeriodEnd
            : (existing?.currentPeriodEnd ?? null),
      };

      const subscription = existing
        ? await tx.organizationSubscription.update({
            where: { organizationId: input.organizationId },
            data: {
              stripeCustomerId: data.stripeCustomerId,
              stripeSubscriptionId: data.stripeSubscriptionId,
              stripePriceId: data.stripePriceId,
              plan: data.plan,
              status: data.status,
              cancelAtPeriodEnd: data.cancelAtPeriodEnd,
              currentPeriodStart: data.currentPeriodStart,
              currentPeriodEnd: data.currentPeriodEnd,
            },
          })
        : await tx.organizationSubscription.create({ data });

      if (input.syncOrgPlan !== false) {
        await tx.organization.update({
          where: { id: input.organizationId },
          data: { plan: input.plan },
        });
      }

      return subscription;
    });
  }
}
