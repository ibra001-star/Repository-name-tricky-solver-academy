import { stripe } from './stripeClient';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { AppError } from '../utils/AppError';
import { kesToUsd } from '../config/pricing';
import * as paymentService from './paymentService';
import { fulfillPayment, markPaymentFailed } from './paymentFulfillmentService';

const requireStripe = () => {
  if (!stripe) throw AppError.badRequest('Stripe is not configured on this server');
  return stripe;
};

export const createSubscriptionCheckoutSession = async (
  userId: string,
  plan: 'MONTHLY' | 'YEARLY' | 'LIFETIME',
  couponCode?: string
) => {
  const client = requireStripe();
  const { payment, amountKes } = await paymentService.initiateSubscriptionPayment({
    userId,
    plan,
    provider: 'STRIPE',
    couponCode,
  });

  return createCheckoutSession(client, payment.id, amountKes, `Tricky Solver Academy — ${plan} Subscription`);
};

export const createPaperPurchaseCheckoutSession = async (userId: string, examId: string, couponCode?: string) => {
  const client = requireStripe();
  const { payment, exam, amountKes } = await paymentService.initiatePaperPurchasePayment({
    userId,
    examId,
    provider: 'STRIPE',
    couponCode,
  });

  return createCheckoutSession(client, payment.id, amountKes, `Tricky Solver Academy — ${exam.title}`);
};

const createCheckoutSession = async (
  client: NonNullable<typeof stripe>,
  paymentId: string,
  amountKes: number,
  productName: string
) => {
  const amountUsd = kesToUsd(amountKes);

  const session = await client.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: productName },
          unit_amount: Math.round(amountUsd * 100), // Stripe expects cents
        },
        quantity: 1,
      },
    ],
    // paymentId travels through so the webhook can find its way back to our
    // record without trusting anything else in the session payload.
    client_reference_id: paymentId,
    metadata: { paymentId },
    success_url: `${env.CLIENT_URL}/payments/success?payment_id=${paymentId}`,
    cancel_url: `${env.CLIENT_URL}/payments/cancelled?payment_id=${paymentId}`,
  });

  await prisma.payment.update({
    where: { id: paymentId },
    data: { stripeCheckoutSessionId: session.id },
  });

  return { paymentId, checkoutUrl: session.url };
};

// Stripe webhooks are cryptographically signed — verifying the signature
// (using the RAW request body, not the parsed JSON) is what proves this
// request actually came from Stripe and wasn't forged by an attacker who
// simply knows a payment ID.
export const handleStripeWebhook = async (rawBody: Buffer, signature: string): Promise<void> => {
  const client = requireStripe();
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw AppError.badRequest('Stripe webhook secret is not configured');
  }

  let event;
  try {
    event = client.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.warn({ err }, 'Stripe webhook signature verification failed');
    throw AppError.badRequest('Invalid webhook signature');
  }

  // Idempotency: Stripe explicitly documents that webhooks may be delivered
  // more than once for the same event. Record the event ID and skip if seen.
  const alreadyProcessed = await prisma.webhookEvent.findUnique({
    where: { provider_externalId: { provider: 'STRIPE', externalId: event.id } },
  });
  if (alreadyProcessed) {
    logger.info({ eventId: event.id }, 'Ignoring duplicate Stripe webhook event');
    return;
  }
  await prisma.webhookEvent.create({
    data: { provider: 'STRIPE', externalId: event.id, eventType: event.type },
  });

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as { client_reference_id?: string | null; payment_intent?: string | null };
    const paymentId = session.client_reference_id;
    if (!paymentId) {
      logger.error({ eventId: event.id }, 'Stripe checkout.session.completed missing client_reference_id');
      return;
    }

    if (typeof session.payment_intent === 'string') {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { stripePaymentIntentId: session.payment_intent },
      });
    }

    await fulfillPayment(paymentId);
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as { client_reference_id?: string | null };
    if (session.client_reference_id) {
      await markPaymentFailed(session.client_reference_id, 'Checkout session expired');
    }
  }
};
