import { Injectable } from '@nestjs/common';
import type { StripeWebhookEvent } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class StripeWebhookEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEventId(eventId: string): Promise<StripeWebhookEvent | null> {
    return this.prisma.stripeWebhookEvent.findUnique({
      where: { eventId },
    });
  }

  /**
   * Inserts a webhook event row. Returns null when event_id already exists (idempotent).
   */
  async tryCreate(eventId: string, type: string): Promise<StripeWebhookEvent | null> {
    try {
      return await this.prisma.stripeWebhookEvent.create({
        data: { eventId, type },
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        return null;
      }
      throw error;
    }
  }

  markProcessed(eventId: string): Promise<StripeWebhookEvent> {
    return this.prisma.stripeWebhookEvent.update({
      where: { eventId },
      data: { processedAt: new Date() },
    });
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    );
  }
}
