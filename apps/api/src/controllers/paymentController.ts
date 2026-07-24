import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import * as paymentService from '../services/paymentService';
import * as mpesaPaymentService from '../services/mpesaPaymentService';
import * as stripePaymentService from '../services/stripePaymentService';
import * as paypalPaymentService from '../services/paypalPaymentService';
import { InitiateSubscriptionInput, InitiatePaperPurchaseInput } from '../utils/validators/paymentValidators';

// ── Subscription initiation (routes to the chosen provider) ──────────────

export const initiateSubscription = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const input = req.body as InitiateSubscriptionInput;

  if (input.provider === 'MPESA') {
    if (!input.phone) throw AppError.badRequest('Phone number is required for M-Pesa payments');
    const result = await mpesaPaymentService.initiateSubscriptionStkPush(
      req.user.id,
      input.plan,
      input.phone,
      input.couponCode
    );
    res.status(200).json({ success: true, data: { method: 'mpesa', ...result } });
    return;
  }

  if (input.provider === 'STRIPE') {
    const result = await stripePaymentService.createSubscriptionCheckoutSession(
      req.user.id,
      input.plan,
      input.couponCode
    );
    res.status(200).json({ success: true, data: { method: 'stripe', ...result } });
    return;
  }

  const result = await paypalPaymentService.createSubscriptionOrder(req.user.id, input.plan, input.couponCode);
  res.status(200).json({ success: true, data: { method: 'paypal', ...result } });
});

// ── Paper purchase initiation ─────────────────────────────────────────────

export const initiatePaperPurchase = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const input = req.body as InitiatePaperPurchaseInput;

  if (input.provider === 'MPESA') {
    if (!input.phone) throw AppError.badRequest('Phone number is required for M-Pesa payments');
    const result = await mpesaPaymentService.initiatePaperPurchaseStkPush(
      req.user.id,
      input.examId,
      input.phone,
      input.couponCode
    );
    res.status(200).json({ success: true, data: { method: 'mpesa', ...result } });
    return;
  }

  if (input.provider === 'STRIPE') {
    const result = await stripePaymentService.createPaperPurchaseCheckoutSession(
      req.user.id,
      input.examId,
      input.couponCode
    );
    res.status(200).json({ success: true, data: { method: 'stripe', ...result } });
    return;
  }

  const result = await paypalPaymentService.createPaperPurchaseOrder(req.user.id, input.examId, input.couponCode);
  res.status(200).json({ success: true, data: { method: 'paypal', ...result } });
});

// ── Shared payment status / history ───────────────────────────────────────

export const getPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const payment = await paymentService.checkPaymentStatus(req.params.paymentId, req.user.id);
  res.status(200).json({ success: true, data: { payment } });
});

export const listMyPayments = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const payments = await paymentService.listMyPayments(req.user.id);
  res.status(200).json({ success: true, data: { payments } });
});

// ── Provider callbacks / webhooks (no user auth — verified by provider-specific means) ──

export const mpesaCallback = asyncHandler(async (req: Request, res: Response) => {
  await mpesaPaymentService.handleMpesaCallback(req.body);
  // Safaricom expects this exact acknowledgement shape regardless of what we
  // did internally — returning anything else can cause Daraja to retry aggressively.
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

export const stripeWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'];
  if (!signature || Array.isArray(signature)) {
    throw AppError.badRequest('Missing Stripe signature header');
  }
  // req.body is the raw Buffer here — see the route definition, which uses
  // express.raw() instead of express.json() specifically for this route.
  await stripePaymentService.handleStripeWebhook(req.body as Buffer, signature);
  res.status(200).json({ received: true });
});

export const paypalWebhook = asyncHandler(async (req: Request, res: Response) => {
  await paypalPaymentService.handlePaypalWebhook(
    req.headers as Record<string, string | string[] | undefined>,
    req.body
  );
  res.status(200).json({ received: true });
});

export const capturePaypalOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const payment = await paypalPaymentService.captureOrder(req.body.orderId, req.body.paymentId, req.user.id);
  res.status(200).json({ success: true, data: { payment } });
});
