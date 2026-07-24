import { PaymentStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { logger } from '../config/logger';
import { incrementCouponUsage } from './couponService';
import { grantReferralRewardIfEligible } from './referralService';
import { sendPaymentConfirmationSms } from './smsService';

const daysFromNow = (days: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

const PLAN_DURATION_DAYS: Record<'MONTHLY' | 'YEARLY', number> = {
  MONTHLY: 30,
  YEARLY: 365,
};

// The single choke point every provider funnels through on success. Keeping
// this provider-agnostic means M-Pesa/Stripe/PayPal can't drift out of sync
// in what "a successful payment" actually grants the user.
export const fulfillPayment = async (paymentId: string): Promise<void> => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { coupon: true, subscription: true, user: { select: { phone: true } } },
  });

  if (!payment) {
    logger.error({ paymentId }, 'fulfillPayment called for a payment that does not exist');
    return;
  }

  // Idempotency guard: if this payment was already marked SUCCESS (e.g. a
  // webhook retried after we'd already processed it), skip re-granting.
  if (payment.status === PaymentStatus.SUCCESS) {
    logger.info({ paymentId }, 'Payment already fulfilled, skipping duplicate fulfillment');
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: paymentId }, data: { status: PaymentStatus.SUCCESS } });

    if (payment.purpose === 'SUBSCRIPTION' && payment.subscriptionId) {
      const subscription = payment.subscription;
      if (subscription) {
        const expiresAt =
          subscription.plan === 'LIFETIME'
            ? null
            : daysFromNow(PLAN_DURATION_DAYS[subscription.plan as 'MONTHLY' | 'YEARLY']);

        await tx.subscription.update({
          where: { id: subscription.id },
          data: { status: 'ACTIVE', startedAt: new Date(), expiresAt },
        });
      }
    }

    if (payment.purpose === 'PAPER_PURCHASE' && payment.examId) {
      const existingGrant = await tx.paperPurchase.findUnique({ where: { paymentId } });
      if (!existingGrant) {
        await tx.paperPurchase.create({
          data: { userId: payment.userId, examId: payment.examId, paymentId },
        });
      }
    }

    if (payment.couponId) {
      await incrementCouponUsage(payment.couponId);
    }

    await tx.notification.create({
      data: {
        userId: payment.userId,
        title: 'Payment successful',
        message:
          payment.purpose === 'SUBSCRIPTION'
            ? 'Your premium subscription is now active. Enjoy full access to Tricky Solver Academy!'
            : 'Your purchase was successful. You now have access to this paper.',
        type: 'in_app',
      },
    });
  });

  // Runs outside the main transaction — this touches the REFERRER's
  // subscription, a different user's record than the one this payment
  // belongs to, so it's kept as a separate best-effort step rather than
  // bundled into the same atomic transaction as the payment's own effects.
  await grantReferralRewardIfEligible(payment.userId).catch((err) => {
    logger.error({ err, paymentId }, 'Failed to grant referral reward (non-fatal)');
  });

  // SMS confirmation is a nice-to-have layered on top of the in-app
  // notification above — only sent if the user has a phone on file, and
  // never allowed to fail the fulfillment flow itself.
  if (payment.user.phone) {
    void sendPaymentConfirmationSms(payment.user.phone, payment.amountKes).catch((err) => {
      logger.error({ err, paymentId }, 'Failed to send SMS payment confirmation (non-fatal)');
    });
  }

  logger.info({ paymentId, userId: payment.userId, purpose: payment.purpose }, 'Payment fulfilled successfully');
};

export const markPaymentFailed = async (paymentId: string, reason: string): Promise<void> => {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status === PaymentStatus.SUCCESS) return;

  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: PaymentStatus.FAILED, metadata: { failureReason: reason } },
  });

  logger.info({ paymentId, reason }, 'Payment marked as failed');
};
