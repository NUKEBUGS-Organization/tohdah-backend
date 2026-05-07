import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Stripe from 'stripe';
import { PaymentsService } from './payments.service';

const stripeInstance = {
  paymentIntents: {
    create: jest.fn(),
    retrieve: jest.fn(),
  },
  refunds: {
    create: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

jest.mock('stripe', () =>
  jest.fn().mockImplementation(() => stripeInstance),
);

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    const config = {
      get: jest.fn((k: string) => {
        if (k === 'STRIPE_SECRET_KEY') return 'sk_test_xxx';
        return undefined;
      }),
      getOrThrow: jest.fn((k: string) => {
        if (k === 'STRIPE_WEBHOOK_SECRET') return 'whsec_test';
        return 'x';
      }),
    } as unknown as ConfigService;
    service = new PaymentsService(config);
  });

  it('createPaymentIntent returns clientSecret and paymentIntentId', async () => {
    stripeInstance.paymentIntents.create.mockResolvedValue({
      id: 'pi_1',
      client_secret: 'secret_1',
    } as Stripe.PaymentIntent);

    const res = await service.createPaymentIntent({
      amount: 12.5,
      currency: 'usd',
      bookingId: 'bid',
      requesterId: 'rid',
    });

    expect(res).toEqual({
      clientSecret: 'secret_1',
      paymentIntentId: 'pi_1',
    });
    expect(stripeInstance.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1250,
        currency: 'usd',
        metadata: { bookingId: 'bid', requesterId: 'rid' },
      }),
    );
  });

  it('handlePaymentSuccess returns bookingId from metadata', async () => {
    stripeInstance.paymentIntents.retrieve.mockResolvedValue({
      id: 'pi_1',
      metadata: { bookingId: 'booking-abc' },
    } as Stripe.PaymentIntent);

    const id = await service.handlePaymentSuccess('pi_1');
    expect(id).toBe('booking-abc');
  });

  it('refundPayment passes partial amount in cents', async () => {
    await service.refundPayment({
      paymentIntentId: 'pi_1',
      amount: 10.5,
    });
    expect(stripeInstance.refunds.create).toHaveBeenCalledWith({
      payment_intent: 'pi_1',
      amount: 1050,
    });
  });

  it('refundPayment omits amount for full refund', async () => {
    await service.refundPayment({ paymentIntentId: 'pi_1' });
    expect(stripeInstance.refunds.create).toHaveBeenCalledWith({
      payment_intent: 'pi_1',
    });
  });

  it('constructWebhookEvent throws on invalid signature', () => {
    stripeInstance.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('bad sig');
    });
    expect(() =>
      service.constructWebhookEvent(Buffer.from('{}'), 'sig'),
    ).toThrow('bad sig');
  });
});

describe('PaymentsService without Stripe key', () => {
  it('createPaymentIntent throws BadRequestException', async () => {
    const config = {
      get: jest.fn(() => undefined),
      getOrThrow: jest.fn(),
    } as unknown as ConfigService;
    const svc = new PaymentsService(config);
    await expect(
      svc.createPaymentIntent({
        amount: 1,
        currency: 'usd',
        bookingId: 'a',
        requesterId: 'b',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
