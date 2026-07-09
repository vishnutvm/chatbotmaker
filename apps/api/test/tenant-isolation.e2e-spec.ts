import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { createTestApp, resetDatabase } from './helpers/test-app.helper';
import { signTestSupabaseJwt } from './helpers/jwt-test.helper';

describe('Tenant isolation (e2e)', () => {
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

  it('USER_A and USER_B each see only their own organization', async () => {
    const userA = signTestSupabaseJwt({ email: 'user-a@org-a.example.com' });
    const userB = signTestSupabaseJwt({ email: 'user-b@org-b.example.com' });

    const onboardA = await request(app!.getHttpServer())
      .post('/api/v1/auth/onboard')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ name: 'User A', organizationName: 'Organization A' })
      .expect(201);

    const onboardB = await request(app!.getHttpServer())
      .post('/api/v1/auth/onboard')
      .set('Authorization', `Bearer ${userB.token}`)
      .send({ name: 'User B', organizationName: 'Organization B' })
      .expect(201);

    expect(onboardA.body.organization.id).not.toBe(onboardB.body.organization.id);

    const meA = await request(app!.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${userA.token}`)
      .expect(200);

    const meB = await request(app!.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${userB.token}`)
      .expect(200);

    expect(meA.body.organizations).toHaveLength(1);
    expect(meB.body.organizations).toHaveLength(1);
    expect(meA.body.organizations[0].name).toBe('Organization A');
    expect(meB.body.organizations[0].name).toBe('Organization B');
    expect(meA.body.organizations[0].id).not.toBe(meB.body.organizations[0].id);
  });

  it('stores users with distinct supabase identities in separate tenant rows', async () => {
    const userA = signTestSupabaseJwt({ email: 'isolation-a@example.com' });
    const userB = signTestSupabaseJwt({ email: 'isolation-b@example.com' });

    await request(app!.getHttpServer())
      .post('/api/v1/auth/onboard')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ name: 'Isolation A', organizationName: 'Tenant A' })
      .expect(201);

    await request(app!.getHttpServer())
      .post('/api/v1/auth/onboard')
      .set('Authorization', `Bearer ${userB.token}`)
      .send({ name: 'Isolation B', organizationName: 'Tenant B' })
      .expect(201);

    const users = await prisma.user.findMany({ include: { memberships: true } });
    const orgs = await prisma.organization.findMany();

    expect(users).toHaveLength(2);
    expect(orgs).toHaveLength(2);
    expect(users[0].memberships[0].organizationId).not.toBe(users[1].memberships[0].organizationId);
  });
});
