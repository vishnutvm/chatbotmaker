import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { createTestApp, resetDatabase } from './helpers/test-app.helper';
import { signTestSupabaseJwt } from './helpers/jwt-test.helper';

describe('Publishable keys + widget bootstrap (e2e)', () => {
  let app: INestApplication | undefined;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.PUBLISHABLE_KEY_PEPPER =
      process.env.PUBLISHABLE_KEY_PEPPER || 'ci-test-publishable-key-pepper-32chars';
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app?.close();
  });

  async function onboardOwner() {
    const user = signTestSupabaseJwt({ email: `owner-${Date.now()}@example.com` });
    const onboard = await request(app!.getHttpServer())
      .post('/api/v1/auth/onboard')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'Owner', organizationName: `Org ${Date.now()}` })
      .expect(201);
    return { user, orgId: onboard.body.organization.id as string };
  }

  it('create → bootstrap live assistant → revoke → bootstrap 401', async () => {
    const { user, orgId } = await onboardOwner();

    const created = await request(app!.getHttpServer())
      .post(`/api/v1/organizations/${orgId}/public-keys`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'Widget' })
      .expect(201);

    expect(created.body.key).toMatch(/^pk_live_/);
    expect(created.body.keyPrefix).toContain('…');

    const list = await request(app!.getHttpServer())
      .get(`/api/v1/organizations/${orgId}/public-keys`)
      .set('Authorization', `Bearer ${user.token}`)
      .expect(200);

    expect(list.body.keys).toHaveLength(1);
    expect(list.body.keys[0].key).toBeUndefined();

    const assistant = await prisma.assistant.create({
      data: {
        organizationId: orgId,
        name: 'Live Bot',
        status: 'live',
        welcomeMessage: 'Hello widget',
        deployedAt: new Date(),
      },
    });

    const boot = await request(app!.getHttpServer())
      .get(`/api/v1/public/widget/bootstrap?assistantId=${assistant.id}`)
      .set('X-Genie-Public-Key', created.body.key)
      .expect(200);

    expect(boot.body).toMatchObject({
      assistantId: assistant.id,
      organizationId: orgId,
      name: 'Live Bot',
      welcomeMessage: 'Hello widget',
    });
    expect(boot.body.instructions).toBeUndefined();

    await request(app!.getHttpServer())
      .post(`/api/v1/organizations/${orgId}/public-keys/${created.body.id}/revoke`)
      .set('Authorization', `Bearer ${user.token}`)
      .expect(200);

    await request(app!.getHttpServer())
      .get(`/api/v1/public/widget/bootstrap?assistantId=${assistant.id}`)
      .set('X-Genie-Public-Key', created.body.key)
      .expect(401);
  });

  it('rejects query-string keys and non-live assistants', async () => {
    const { user, orgId } = await onboardOwner();

    const created = await request(app!.getHttpServer())
      .post(`/api/v1/organizations/${orgId}/public-keys`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({})
      .expect(201);

    const draft = await prisma.assistant.create({
      data: {
        organizationId: orgId,
        name: 'Draft Bot',
        status: 'draft',
      },
    });

    await request(app!.getHttpServer())
      .get(
        `/api/v1/public/widget/bootstrap?assistantId=${draft.id}&apiKey=${encodeURIComponent(created.body.key)}`,
      )
      .expect(400);

    await request(app!.getHttpServer())
      .get(`/api/v1/public/widget/bootstrap?assistantId=${draft.id}`)
      .set('X-Genie-Public-Key', created.body.key)
      .expect(404);
  });

  it('rejects cross-tenant assistant ids', async () => {
    const a = await onboardOwner();
    const b = await onboardOwner();

    const keyA = await request(app!.getHttpServer())
      .post(`/api/v1/organizations/${a.orgId}/public-keys`)
      .set('Authorization', `Bearer ${a.user.token}`)
      .send({})
      .expect(201);

    const assistantB = await prisma.assistant.create({
      data: {
        organizationId: b.orgId,
        name: 'Other tenant',
        status: 'live',
        deployedAt: new Date(),
      },
    });

    await request(app!.getHttpServer())
      .get(`/api/v1/public/widget/bootstrap?assistantId=${assistantB.id}`)
      .set('X-Genie-Public-Key', keyA.body.key)
      .expect(404);
  });
});
