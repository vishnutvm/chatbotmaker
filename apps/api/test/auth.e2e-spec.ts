import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { createTestApp, resetDatabase } from './helpers/test-app.helper';
import { signTestSupabaseJwt } from './helpers/jwt-test.helper';

describe('Auth (e2e)', () => {
  let app: INestApplication | undefined;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('POST /api/v1/auth/onboard creates user and organization', async () => {
    const { token, email } = signTestSupabaseJwt({ email: 'onboard@example.com' });

    const response = await request(app!.getHttpServer())
      .post('/api/v1/auth/onboard')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test User', organizationName: 'Acme Corp' })
      .expect(201);

    expect(response.body.user.email).toBe('onboard@example.com');
    expect(response.body.user.name).toBe('Test User');
    expect(response.body.organization.name).toBe('Acme Corp');
    expect(response.body.organization.role).toBe('owner');
  });

  it('GET /api/v1/auth/me returns profile after onboard', async () => {
    const { token } = signTestSupabaseJwt({ email: 'me@example.com' });

    await request(app!.getHttpServer())
      .post('/api/v1/auth/onboard')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Me User' })
      .expect(201);

    const me = await request(app!.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(me.body.user.email).toBe('me@example.com');
    expect(me.body.organizations).toHaveLength(1);
    expect(me.body.organizations[0].role).toBe('owner');
  });

  it('rejects onboard without token', async () => {
    await request(app!.getHttpServer())
      .post('/api/v1/auth/onboard')
      .send({ name: 'No Auth' })
      .expect(401);
  });

  it('rejects duplicate onboard', async () => {
    const { token } = signTestSupabaseJwt({ email: 'dup@example.com' });

    await request(app!.getHttpServer())
      .post('/api/v1/auth/onboard')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dup User' })
      .expect(201);

    await request(app!.getHttpServer())
      .post('/api/v1/auth/onboard')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dup User Again' })
      .expect(409);
  });

  it('rejects invalid token on /me', async () => {
    await request(app!.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('GET /api/v1/auth/session returns onboarded false without token', async () => {
    const response = await request(app!.getHttpServer()).get('/api/v1/auth/session').expect(200);

    expect(response.body.onboarded).toBe(false);
  });
});
