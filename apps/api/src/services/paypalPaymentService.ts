import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { AppError } from '../utils/AppError';
import { kesToUsd } from '../config/pricing';
import * as paypalClient from './paypalClient';
import * as paymentService from './paymentService';
import { fulfillPayment } from './paymentFulfillmentService';

export const createSubscriptionOrder = async (
  userId: string,
  plan: 'MONTHLY' | 'YEARLY' | 'LIFETIME',
  couponCode?: string
) => {
  const { payment, amountKes } = await paymentService.initiateSubscriptionPayment({
    userId,
    plan,
    provider: 'PAYPAL',
    couponCode,
  });

  return createOrder(payment.id, amountKes, `Tricky Solver Academy — ${plan} Subscription`);
};

export const createPaperPurchaseOrder = async (userId: string, examId: string, couponCode?: string) => {
  const { payment, exam, amountKes } = await paymentService.initiatePaperPurchasePayment({
    userId,
    examId,
    provider: 'PAYPAL',
    couponCode,
  });

  return createOrder(payment.id, amountKes, `Tricky Solver Academy — ${exam.title}`);
};

const createOrder = async (paymentId: string, amountKes: number, description: string) => {
  const amountUsd = kesToUsd(amountKes);

  const order = await paypalClient.createPaypalOrder({
    paymentId,
    amountUsd,
    description,
    returnUrl: `${env.CLIENT_URL}/payments/paypal/return?payment_id=${paymentId}`,
    cancelUrl: `${env.CLIENT_URL}/payments/cancelled?payment_id=${paymentId}`,
  });

  await prisma.payment.update({ where: { id: paymentId }, data: { paypalOrderId: order.orderId } });

  return { paymentId, orderId: order.orderId, approveUrl: order.approveUrl };
};

// Called when the customer is redirected back from PayPal after approving
// the order. We verify the orderId belongs to the claimed payment before
// capturing, so a caller can't pass an arbitrary orderId/paymentId pair.
export const captureOrder = async (orderId: string, paymentId: string, userId: string) => {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });

  if (!payment || payment.userId !== userId) throw AppError.notFound('Payment not found');
  if (payment.paypalOrderId !== orderId) throw AppError.badRequest('Order ID does not match this payment');

  if (payment.status === 'SUCCESS') {
    return payment; // already fulfilled — idempotent no-op
  }

  const result = await paypalClient.capturePaypalOrder(orderId);

  if (result.status !== 'COMPLETED') {
    logger.warn({ paymentId, orderId, status: result.status }, 'PayPal capture did not complete');
    throw AppError.badRequest('Payment could not be completed. Please try again.');
  }

  await fulfillPayment(paymentId);
  return prisma.payment.findUnique({ where: { id: paymentId } });
};

// PayPal webhooks arrive as a fallback/confirmation path even when the
// client-side capture succeeds — handling both means a closed browser tab
// after approval doesn't leave the payment stuck PENDING forever.
export const handlePaypalWebhook = async (
  headers: Record<string, string | string[] | undefined>,
  body: { id: string; event_type: string; resource?: { custom_id?: string; id?: string } }
): Promise<void> => {
  const verified = await paypalClient.verifyPaypalWebhookSignature(headers, body);
  if (!verified) {
    logger.warn({ eventId: body.id }, 'PayPal webhook signature verification failed');
    throw AppError.badRequest('Invalid webhook signature');
  }

  const alreadyProcessed = await prisma.webhookEvent.findUnique({
    where: { provider_externalId: { provider: 'PAYPAL', externalId: body.id } },
  });
  if (alreadyProcessed) {
    logger.info({ eventId: body.id }, 'Ignoring duplicate PayPal webhook event');
    return;
  }
  await prisma.webhookEvent.create({
    data: { provider: 'PAYPAL', externalId: body.id, eventType: body.event_type },
  });

  if (body.event_type === 'CHECKOUT.ORDER.APPROVED' || body.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const paymentId = body.resource?.custom_id;
    if (!paymentId) {
      logger.error({ eventId: body.id }, 'PayPal webhook missing custom_id');
      return;
    }
    await fulfillPayment(paymentId);
  }
};
