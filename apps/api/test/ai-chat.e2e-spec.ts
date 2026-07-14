import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AI_PROVIDER } from '../src/infrastructure/ai/ai.interface';
import type { AIProvider, ChatResult } from '../src/infrastructure/ai/ai.interface';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { resetDatabase } from './helpers/test-app.helper';
import { signTestSupabaseJwt } from './helpers/jwt-test.helper';

describe('AI chat completions (e2e)', () => {
  let app: INestApplication | undefined;
  let prisma: PrismaService;
  let mockProvider: jest.Mocked<AIProvider>;

  beforeAll(async () => {
    mockProvider = {
      chat: jest.fn(),
      stream: jest.fn(),
      embed: jest.fn(),
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
    process.env.OPENAI_API_KEY = 'sk-test-e2e';
  });

  afterAll(async () => {
    await app?.close();
  });

  async function onboardUser(email: string) {
    const jwt = signTestSupabaseJwt({ email });
    const res = await request(app!.getHttpServer())
      .post('/api/v1/auth/onboard')
      .set('Authorization', `Bearer ${jwt.token}`)
      .send({ name: 'AI Tester', organizationName: `Org ${email}` })
      .expect(201);

    return {
      token: jwt.token,
      organizationId: res.body.organization.id as string,
      userId: res.body.user.id as string,
    };
  }

  it('rejects unauthenticated requests', async () => {
    await request(app!.getHttpServer())
      .post('/api/v1/organizations/550e8400-e29b-41d4-a716-446655440000/ai/chat/completions')
      .send({ messages: [{ role: 'user', content: 'Hi' }] })
      .expect(401);
  });

  it('rejects client model field', async () => {
    const { token, organizationId } = await onboardUser('ai-model@example.com');

    const res = await request(app!.getHttpServer())
      .post(`/api/v1/organizations/${organizationId}/ai/chat/completions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Hi' }],
      })
      .expect(400);

    expect(JSON.stringify(res.body)).toMatch(/model/i);
    expect(mockProvider.chat).not.toHaveBeenCalled();
  });

  it('returns 403 when user is not a member', async () => {
    const owner = await onboardUser('ai-owner@example.com');
    const stranger = await onboardUser('ai-stranger@example.com');

    await request(app!.getHttpServer())
      .post(`/api/v1/organizations/${owner.organizationId}/ai/chat/completions`)
      .set('Authorization', `Bearer ${stranger.token}`)
      .send({ messages: [{ role: 'user', content: 'Hi' }] })
      .expect(403);

    expect(mockProvider.chat).not.toHaveBeenCalled();
  });

  it('returns chat completion on happy path', async () => {
    const { token, organizationId } = await onboardUser('ai-happy@example.com');

    const providerResult: ChatResult = {
      id: 'chatcmpl_e2e',
      model: 'gpt-4o-mini',
      content: 'Welcome!',
      finishReason: 'stop',
      usage: { promptTokens: 8, completionTokens: 3, totalTokens: 11 },
    };
    mockProvider.chat.mockResolvedValue(providerResult);

    const res = await request(app!.getHttpServer())
      .post(`/api/v1/organizations/${organizationId}/ai/chat/completions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        systemPrompt: 'Be brief.',
        messages: [{ role: 'user', content: 'Hello' }],
        maxTokens: 256,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      id: 'chatcmpl_e2e',
      organizationId,
      model: 'gpt-4o-mini',
      content: 'Welcome!',
      finishReason: 'stop',
      usage: providerResult.usage,
    });

    expect(mockProvider.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-mini',
        maxTokens: 256,
        messages: [
          { role: 'system', content: 'Be brief.' },
          { role: 'user', content: 'Hello' },
        ],
      }),
    );
  });

  it('streams SSE meta, delta, and done events', async () => {
    process.env.OPENAI_API_KEY = 'sk-test-e2e';
    const { token, organizationId } = await onboardUser('ai-stream@example.com');

    mockProvider.stream.mockImplementation(async function* () {
      yield { type: 'delta' as const, content: 'Hi ' };
      yield { type: 'delta' as const, content: 'there' };
      yield {
        type: 'done' as const,
        finishReason: 'stop',
        usage: { promptTokens: 3, completionTokens: 2, totalTokens: 5 },
      };
    });

    const res = await request(app!.getHttpServer())
      .post(`/api/v1/organizations/${organizationId}/ai/chat/completions/stream`)
      .set('Authorization', `Bearer ${token}`)
      .send({ messages: [{ role: 'user', content: 'Hello' }] })
      .expect(200);

    expect(res.headers['content-type']).toMatch(/text\/event-stream/);
    expect(res.text).toContain('event: meta');
    expect(res.text).toContain('event: delta');
    expect(res.text).toContain('event: done');
    expect(res.text).toContain('"content":"Hi "');
    expect(mockProvider.stream).toHaveBeenCalled();
  });

  it('returns HTTP 503 before SSE when OpenAI key is missing', async () => {
    const previous = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
      const { token, organizationId } = await onboardUser('ai-noconfig@example.com');

      const res = await request(app!.getHttpServer())
        .post(`/api/v1/organizations/${organizationId}/ai/chat/completions/stream`)
        .set('Authorization', `Bearer ${token}`)
        .send({ messages: [{ role: 'user', content: 'Hello' }] })
        .expect(503);

      expect(res.headers['content-type']).toMatch(/json/);
      expect(JSON.stringify(res.body)).toMatch(/AI_NOT_CONFIGURED|not configured/i);
      expect(mockProvider.stream).not.toHaveBeenCalled();
    } finally {
      if (previous === undefined) {
        delete process.env.OPENAI_API_KEY;
      } else {
        process.env.OPENAI_API_KEY = previous;
      }
    }
  });
});
