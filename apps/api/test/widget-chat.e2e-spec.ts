import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AI_PROVIDER } from '../src/infrastructure/ai/ai.interface';
import type { AIProvider } from '../src/infrastructure/ai/ai.interface';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { resetDatabase } from './helpers/test-app.helper';
import { signTestSupabaseJwt } from './helpers/jwt-test.helper';

describe('Public widget chat stream (e2e)', () => {
  let app: INestApplication | undefined;
  let prisma: PrismaService;
  let mockProvider: jest.Mocked<AIProvider>;

  beforeAll(async () => {
    process.env.PUBLISHABLE_KEY_PEPPER =
      process.env.PUBLISHABLE_KEY_PEPPER || 'ci-test-publishable-key-pepper-32chars';
    process.env.OPENAI_API_KEY = 'sk-test-e2e';

    mockProvider = {
      chat: jest.fn(),
      stream: jest.fn(),
      embed: jest.fn().mockResolvedValue([[0.1, 0.2]]),
    };

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AI_PROVIDER)
      .useValue(mockProvider)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['health', 'version'] });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    mockProvider.chat.mockReset();
    mockProvider.stream.mockReset();
    mockProvider.embed.mockReset();
    mockProvider.embed.mockResolvedValue([[0.1, 0.2]]);
    process.env.OPENAI_API_KEY = 'sk-test-e2e';
  });

  afterAll(async () => {
    await app?.close();
  });

  async function onboardWithKeyAndLiveAssistant() {
    const user = signTestSupabaseJwt({ email: `widget-chat-${Date.now()}@example.com` });
    const onboard = await request(app!.getHttpServer())
      .post('/api/v1/auth/onboard')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'Owner', organizationName: `Org ${Date.now()}` })
      .expect(201);

    const orgId = onboard.body.organization.id as string;

    const keyRes = await request(app!.getHttpServer())
      .post(`/api/v1/organizations/${orgId}/public-keys`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'Widget' })
      .expect(201);

    const assistant = await prisma.assistant.create({
      data: {
        organizationId: orgId,
        name: 'Live Bot',
        status: 'live',
        welcomeMessage: 'Hello',
        instructions: 'Be brief.',
        deployedAt: new Date(),
      },
    });

    return { orgId, key: keyRes.body.key as string, assistantId: assistant.id };
  }

  it('rejects missing publishable key with 401', async () => {
    await request(app!.getHttpServer())
      .post('/api/v1/public/widget/chat/stream')
      .send({
        assistantId: '550e8400-e29b-41d4-a716-446655440000',
        messages: [{ role: 'user', content: 'Hi' }],
      })
      .expect(401);
  });

  it('rejects invalid body with 400', async () => {
    const { key, assistantId } = await onboardWithKeyAndLiveAssistant();

    await request(app!.getHttpServer())
      .post('/api/v1/public/widget/chat/stream')
      .set('X-Genie-Public-Key', key)
      .send({
        assistantId,
        messages: [],
      })
      .expect(400);

    await request(app!.getHttpServer())
      .post('/api/v1/public/widget/chat/stream')
      .set('X-Genie-Public-Key', key)
      .send({
        assistantId,
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Hi' }],
      })
      .expect(400);

    expect(mockProvider.stream).not.toHaveBeenCalled();
  });

  it('returns 404 for draft assistants', async () => {
    const { orgId, key } = await onboardWithKeyAndLiveAssistant();
    const draft = await prisma.assistant.create({
      data: {
        organizationId: orgId,
        name: 'Draft',
        status: 'draft',
      },
    });

    await request(app!.getHttpServer())
      .post('/api/v1/public/widget/chat/stream')
      .set('X-Genie-Public-Key', key)
      .send({
        assistantId: draft.id,
        messages: [{ role: 'user', content: 'Hi' }],
      })
      .expect(404);

    expect(mockProvider.stream).not.toHaveBeenCalled();
  });

  it('returns 404 for cross-tenant assistants', async () => {
    const a = await onboardWithKeyAndLiveAssistant();
    const b = await onboardWithKeyAndLiveAssistant();

    await request(app!.getHttpServer())
      .post('/api/v1/public/widget/chat/stream')
      .set('X-Genie-Public-Key', a.key)
      .send({
        assistantId: b.assistantId,
        messages: [{ role: 'user', content: 'Hi' }],
      })
      .expect(404);

    expect(mockProvider.stream).not.toHaveBeenCalled();
  });

  it('streams SSE meta, delta, and done on happy path', async () => {
    const { orgId, key, assistantId } = await onboardWithKeyAndLiveAssistant();

    mockProvider.stream.mockImplementation(async function* () {
      yield { type: 'delta' as const, content: 'We ' };
      yield { type: 'delta' as const, content: 'are open' };
      yield {
        type: 'done' as const,
        finishReason: 'stop',
        usage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 },
      };
    });

    const res = await request(app!.getHttpServer())
      .post('/api/v1/public/widget/chat/stream')
      .set('X-Genie-Public-Key', key)
      .send({
        assistantId,
        messages: [{ role: 'user', content: 'What are your hours?' }],
      })
      .expect(200);

    expect(res.headers['content-type']).toMatch(/text\/event-stream/);
    expect(res.text).toContain('event: meta');
    expect(res.text).toContain('"model":');
    expect(res.text).not.toContain(`"organizationId":"${orgId}"`);
    expect(res.text).toContain('event: delta');
    expect(res.text).toContain('"content":"We "');
    expect(res.text).toContain('event: done');
    expect(mockProvider.stream).toHaveBeenCalled();

    const usage = await prisma.aiUsageEvent.findFirst({
      where: { organizationId: orgId, operation: 'chat_stream' },
    });
    expect(usage).toBeTruthy();
    expect(usage?.userId).toBeNull();
  });

  it('returns 400 when last message is not role user', async () => {
    const { key, assistantId } = await onboardWithKeyAndLiveAssistant();

    await request(app!.getHttpServer())
      .post('/api/v1/public/widget/chat/stream')
      .set('X-Genie-Public-Key', key)
      .send({
        assistantId,
        messages: [
          { role: 'user', content: 'Hi' },
          { role: 'assistant', content: 'Hello' },
        ],
      })
      .expect(400);

    expect(mockProvider.stream).not.toHaveBeenCalled();
  });
});
