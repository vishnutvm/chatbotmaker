import { ValidationPipe } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication({ rawBody: true });
  app.setGlobalPrefix('api/v1', { exclude: ['health', 'version'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  return app;
}

export async function resetDatabase(prisma: PrismaService): Promise<void> {
  const url = process.env.DATABASE_URL ?? '';
  const isTestDatabase =
    url.includes('genie_ci') ||
    url.includes('genie_dev') ||
    url.includes('localhost') ||
    url.includes('127.0.0.1');

  if (!isTestDatabase) {
    throw new Error(
      'Refusing to reset database: point DATABASE_URL to a local test database for e2e tests',
    );
  }

  await prisma.stripeWebhookEvent.deleteMany();
  await prisma.organizationSubscription.deleteMany();
  await prisma.aiUsageEvent.deleteMany();
  await prisma.publishableApiKey.deleteMany();
  await prisma.documentChunk.deleteMany();
  await prisma.knowledgeSource.deleteMany();
  await prisma.assistant.deleteMany();
  await prisma.organizationInvitation.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();
}
