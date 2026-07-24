import { prisma } from '../config/prisma';
import { logger } from '../config/logger';
import * as mpesaClient from './mpesaClient';
import * as paymentService from './paymentService';
import { fulfillPayment, markPaymentFailed } from './paymentFulfillmentService';

export const initiateSubscriptionStkPush = async (
  userId: string,
  plan: 'MONTHLY' | 'YEARLY' | 'LIFETIME',
  phone: string,
  couponCode?: string
) => {
  const { payment, amountKes } = await paymentService.initiateSubscriptionPayment({
    userId,
    plan,
    provider: 'MPESA',
    couponCode,
  });

  return attachStkPush(payment.id, phone, amountKes, `TSA-SUB-${plan}`, 'Subscription');
};

export const initiatePaperPurchaseStkPush = async (
  userId: string,
  examId: string,
  phone: string,
  couponCode?: string
) => {
  const { payment, amountKes } = await paymentService.initiatePaperPurchasePayment({
    userId,
    examId,
    provider: 'MPESA',
    couponCode,
  });

  return attachStkPush(payment.id, phone, amountKes, 'TSA-PAPER', 'Paper Purchase');
};

const attachStkPush = async (
  paymentId: string,
  phone: string,
  amountKes: number,
  accountReference: string,
  transactionDesc: string
) => {
  try {
    const stk = await mpesaClient.initiateStkPush({ phone, amountKes, accountReference, transactionDesc });

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        mpesaMerchantRequestId: stk.merchantRequestId,
        mpesaCheckoutRequestId: stk.checkoutRequestId,
      },
    });

    return {
      paymentId,
      checkoutRequestId: stk.checkoutRequestId,
      customerMessage: stk.customerMessage,
    };
  } catch (err) {
    // If STK push initiation itself fails (bad phone, Daraja down, etc.),
    // mark the payment failed immediately rather than leaving it PENDING
    // forever with no way for the callback to ever arrive.
    await markPaymentFailed(paymentId, err instanceof Error ? err.message : 'STK push initiation failed');
    throw err;
  }
};

interface MpesaCallbackPayload {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value?: string | number }>;
      };
    };
  };
}

// Handles the async callback Safaricom POSTs once the customer completes
// (or cancels/times out) the STK push prompt. This endpoint has no user
// session — Safaricom calls it directly — so trust is established purely
// by matching CheckoutRequestID to a PENDING payment we created ourselves.
export const handleMpesaCallback = async (payload: MpesaCallbackPayload): Promise<void> => {
  const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = payload.Body.stkCallback;

  const payment = await prisma.payment.findUnique({ where: { mpesaCheckoutRequestId: CheckoutRequestID } });

  if (!payment) {
    logger.warn({ CheckoutRequestID }, 'M-Pesa callback received for unknown CheckoutRequestID');
    return;
  }

  // Idempotency: Safaricom can retry callbacks. If we've already resolved
  // this payment (success or failure), don't process it again.
  if (payment.status !== 'PENDING') {
    logger.info({ paymentId: payment.id, status: payment.status }, 'Ignoring duplicate M-Pesa callback');
    return;
  }

  if (ResultCode !== 0) {
    // ResultCode 1032 = user cancelled, 1037 = timeout, etc. — all non-zero
    // codes mean the payment did not go through.
    await markPaymentFailed(payment.id, ResultDesc);
    return;
  }

  const items = CallbackMetadata?.Item ?? [];
  const getValue = (name: string) => items.find((i) => i.Name === name)?.Value;
  const mpesaReceiptNumber = getValue('MpesaReceiptNumber') as string | undefined;

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      mpesaReceiptNumber,
      metadata: payload as unknown as object,
    },
  });

  await fulfillPayment(payment.id);
};


