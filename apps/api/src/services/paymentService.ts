import { PaymentProvider } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { getSubscriptionPriceKes, applyDiscount } from '../config/pricing';
import { validateCoupon } from './couponService';
import * as mpesaClient from './mpesaClient';
import { fulfillPayment } from './paymentFulfillmentService';

interface InitSubscriptionArgs {
  userId: string;
  plan: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  provider: PaymentProvider;
  couponCode?: string;
}

// Creates a PENDING Subscription + PENDING Payment pair, applying a coupon
// discount if provided. Returns the payment so the caller (a specific
// provider's initiation flow) can attach provider-specific fields to it.
export const initiateSubscriptionPayment = async ({ userId, plan, provider, couponCode }: InitSubscriptionArgs) => {
  const basePrice = getSubscriptionPriceKes(plan);

  let coupon = null;
  let amountKes = basePrice;
  if (couponCode) {
    coupon = await validateCoupon(couponCode);
    amountKes = applyDiscount(basePrice, coupon.discountPercent);
  }

  // Prevent stacking active subscriptions: if the user already has an ACTIVE
  // non-expired subscription, block a new purchase rather than silently
  // creating a second one that never gets used.
  const existingActive = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
  if (existingActive) {
    throw AppError.conflict('You already have an active subscription');
  }

  return prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.create({
      data: { userId, plan, status: 'PENDING' },
    });

    const payment = await tx.payment.create({
      data: {
        userId,
        provider,
        purpose: 'SUBSCRIPTION',
        status: 'PENDING',
        amountKes,
        subscriptionId: subscription.id,
        couponId: coupon?.id,
      },
    });

    return { payment, subscription, amountKes };
  });
};

interface InitPaperPurchaseArgs {
  userId: string;
  examId: string;
  provider: PaymentProvider;
  couponCode?: string;
}

export const initiatePaperPurchasePayment = async ({ userId, examId, provider, couponCode }: InitPaperPurchaseArgs) => {
  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam || !exam.isPublished) throw AppError.notFound('Exam not found');
  if (!exam.isPremium || !exam.priceKes) {
    throw AppError.badRequest('This exam is free and does not require purchase');
  }

  const alreadyPurchased = await prisma.paperPurchase.findUnique({
    where: { userId_examId: { userId, examId } },
  });
  if (alreadyPurchased) throw AppError.conflict('You have already purchased this paper');

  let coupon = null;
  let amountKes = exam.priceKes;
  if (couponCode) {
    coupon = await validateCoupon(couponCode);
    amountKes = applyDiscount(amountKes, coupon.discountPercent);
  }

  const payment = await prisma.payment.create({
    data: {
      userId,
      provider,
      purpose: 'PAPER_PURCHASE',
      status: 'PENDING',
      amountKes,
      examId,
      couponId: coupon?.id,
    },
  });

  return { payment, exam, amountKes };
};

export const getPaymentById = async (paymentId: string, userId: string) => {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.userId !== userId) throw AppError.notFound('Payment not found');
  return payment;
};

export const listMyPayments = async (userId: string) => {
  return prisma.payment.findMany({
    where: { userId },
    include: { subscription: true, paperPurchase: { include: { exam: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

// Used by the client to poll for status if a webhook/callback hasn't landed
// yet. For M-Pesa specifically, actively re-queries Daraja rather than just
// returning stale PENDING, since STK push callbacks can occasionally be
// delayed or lost; other providers just return current DB state.
export const checkPaymentStatus = async (paymentId: string, userId: string) => {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.userId !== userId) throw AppError.notFound('Payment not found');

  if (payment.provider === 'MPESA' && payment.status === 'PENDING' && payment.mpesaCheckoutRequestId) {
    try {
      const result = await mpesaClient.queryStkPushStatus(payment.mpesaCheckoutRequestId);
      if (result.ResultCode === '0') {
        await fulfillPayment(payment.id);
      }
    } catch {
      // Query failures are non-fatal — fall through and return current DB state.
    }
  }

  return prisma.payment.findUnique({ where: { id: paymentId } });
};
