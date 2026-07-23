import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PAYMENT_PROVIDER } from '../src/infrastructure/billing/payment-provider.interface';
import {
  PaymentProviderNotConfiguredError,
  StripeWebhookSignatureError,
  type PaymentProvider,
} from '../src/infrastructure/billing/payment-provider.interface';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { resetDatabase } from './helpers/test-app.helper';
import { signTestSupabaseJwt } from './helpers/jwt-test.helper';

describe('Billing (e2e)', () => {
  let app: INestApplication | undefined;
  let prisma: PrismaService;
  let paymentProvider: jest.Mocked<PaymentProvider>;

  const originalEnv = { ...process.env };

  beforeAll(async () => {
    paymentProvider = {
      createCustomer: jest.fn(),
      createCheckoutSession: jest.fn(),
      createPortalSession: jest.fn(),
      constructWebhookEvent: jest.fn(),
    };

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PAYMENT_PROVIDER)
      .useValue(paymentProvider)
      .compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
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
    process.env = { ...originalEnv };
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_PRICE_STARTER;
    delete process.env.STRIPE_PRICE_PRO;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    paymentProvider.createCustomer.mockReset();
    paymentProvider.createCheckoutSession.mockReset();
    paymentProvider.createPortalSession.mockReset();
    paymentProvider.constructWebhookEvent.mockReset();
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    process.env = { ...originalEnv };
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

  async function addMember(orgId: string) {
    const member = signTestSupabaseJwt({ email: `member-${Date.now()}@example.com` });
    await request(app!.getHttpServer())
      .post('/api/v1/auth/onboard')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ name: 'Member', organizationName: `Other ${Date.now()}` })
      .expect(201);

    const dbUser = await prisma.user.findFirst({
      where: { email: member.email },
    });
    if (!dbUser) {
      throw new Error('member user not found after onboard');
    }

    await prisma.organizationMember.create({
      data: {
        userId: dbUser.id,
        organizationId: orgId,
        role: 'member',
      },
    });

    return member;
  }

  it('GET subscription returns free default with catalog', async () => {
    const { user, orgId } = await onboardOwner();

    const res = await request(app!.getHttpServer())
      .get(`/api/v1/organizations/${orgId}/billing/subscription`)
      .set('Authorization', `Bearer ${user.token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      organizationId: orgId,
      plan: 'free',
      status: 'none',
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      canCheckout: false,
      canManageBilling: false,
    });
    expect(res.body.plans.map((p: { key: string }) => p.key)).toEqual([
      'free',
      'starter',
      'pro',
    ]);
  });

  it('checkout returns 403 for member', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_x';
    process.env.STRIPE_PRICE_STARTER = 'price_starter';
    process.env.STRIPE_PRICE_PRO = 'price_pro';

    const { user, orgId } = await onboardOwner();
    const member = await addMember(orgId);

    await request(app!.getHttpServer())
      .post(`/api/v1/organizations/${orgId}/billing/checkout-session`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({ plan: 'starter' })
      .expect(403);

    expect(paymentProvider.createCheckoutSession).not.toHaveBeenCalled();
  });

  it('checkout returns 503 when Stripe is unset', async () => {
    const { user, orgId } = await onboardOwner();

    await request(app!.getHttpServer())
      .post(`/api/v1/organizations/${orgId}/billing/checkout-session`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ plan: 'starter' })
      .expect(503);

    expect(paymentProvider.createCheckoutSession).not.toHaveBeenCalled();
  });

  it('webhook invalid signature returns 400', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_x';
    paymentProvider.constructWebhookEvent.mockImplementation(() => {
      throw new StripeWebhookSignatureError();
    });

    await request(app!.getHttpServer())
      .post('/api/v1/webhooks/stripe')
      .set('Stripe-Signature', 't=1,v1=bad')
      .set('Content-Type', 'application/json')
      .send({ id: 'evt_1' })
      .expect(400);
  });

  it('webhook happy path updates plan via subscription.updated', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_x';
    process.env.STRIPE_PRICE_STARTER = 'price_starter';
    process.env.STRIPE_PRICE_PRO = 'price_pro';

    const { user, orgId } = await onboardOwner();

    paymentProvider.constructWebhookEvent.mockReturnValue({
      id: `evt_${Date.now()}`,
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_live_1',
          customer: 'cus_live_1',
          status: 'active',
          cancel_at_period_end: false,
          current_period_start: 1_700_000_000,
          current_period_end: 1_700_100_000,
          items: { data: [{ price: { id: 'price_starter' } }] },
          metadata: { organizationId: orgId },
        },
      },
    });

    await request(app!.getHttpServer())
      .post('/api/v1/webhooks/stripe')
      .set('Stripe-Signature', 't=1,v1=test')
      .set('Content-Type', 'application/json')
      .send({ type: 'customer.subscription.updated' })
      .expect(200)
      .expect({ received: true });

    const status = await request(app!.getHttpServer())
      .get(`/api/v1/organizations/${orgId}/billing/subscription`)
      .set('Authorization', `Bearer ${user.token}`)
      .expect(200);

    expect(status.body.plan).toBe('starter');
    expect(status.body.status).toBe('active');

    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    expect(org?.plan).toBe('starter');
  });

  it('maps provider not configured during construct to 503', async () => {
    paymentProvider.constructWebhookEvent.mockImplementation(() => {
      throw new PaymentProviderNotConfiguredError();
    });

    await request(app!.getHttpServer())
      .post('/api/v1/webhooks/stripe')
      .set('Stripe-Signature', 't=1,v1=test')
      .set('Content-Type', 'application/json')
      .send({})
      .expect(503);
  });
});
