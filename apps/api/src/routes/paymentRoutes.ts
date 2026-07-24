import { Router } from 'express';
import * as paymentController from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';
import {
  initiateSubscriptionSchema,
  initiatePaperPurchaseSchema,
  capturePaypalOrderSchema,
  applyCouponSchema,
} from '../utils/validators/paymentValidators';
import * as couponController from '../controllers/couponController';

const router = Router();

/**
 * @openapi
 * /payments/subscriptions:
 *   post:
 *     tags: [Payments]
 *     summary: Initiate a subscription payment via M-Pesa, Stripe, or PayPal
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plan, provider]
 *             properties:
 *               plan: { type: string, enum: [MONTHLY, YEARLY, LIFETIME] }
 *               provider: { type: string, enum: [MPESA, STRIPE, PAYPAL] }
 *               couponCode: { type: string }
 *               phone: { type: string, description: "Required when provider is MPESA" }
 *     responses:
 *       200: { description: Payment initiated — response shape depends on provider }
 *       409: { description: User already has an active subscription }
 */
router.post(
  '/subscriptions',
  authenticate,
  authLimiter,
  validate(initiateSubscriptionSchema),
  paymentController.initiateSubscription
);

/**
 * @openapi
 * /payments/papers:
 *   post:
 *     tags: [Payments]
 *     summary: Initiate a one-off paper purchase payment
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [examId, provider]
 *             properties:
 *               examId: { type: string }
 *               provider: { type: string, enum: [MPESA, STRIPE, PAYPAL] }
 *               couponCode: { type: string }
 *               phone: { type: string }
 *     responses:
 *       200: { description: Payment initiated }
 *       409: { description: Paper already purchased }
 */
router.post(
  '/papers',
  authenticate,
  authLimiter,
  validate(initiatePaperPurchaseSchema),
  paymentController.initiatePaperPurchase
);

/**
 * @openapi
 * /payments/mine:
 *   get:
 *     tags: [Payments]
 *     summary: List the current user's payment history
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Payment history returned }
 */
router.get('/mine', authenticate, paymentController.listMyPayments);

/**
 * @openapi
 * /payments/{paymentId}/status:
 *   get:
 *     tags: [Payments]
 *     summary: Get the current status of a payment (actively re-checks M-Pesa if still pending)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Payment status returned }
 */
router.get('/:paymentId/status', authenticate, paymentController.getPaymentStatus);

/**
 * @openapi
 * /payments/paypal/capture:
 *   post:
 *     tags: [Payments]
 *     summary: Capture an approved PayPal order after the customer returns from PayPal
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, paymentId]
 *             properties:
 *               orderId: { type: string }
 *               paymentId: { type: string }
 *     responses:
 *       200: { description: Payment captured and fulfilled }
 */
router.post('/paypal/capture', authenticate, validate(capturePaypalOrderSchema), paymentController.capturePaypalOrder);

/**
 * @openapi
 * /payments/mpesa/callback:
 *   post:
 *     tags: [Payments]
 *     summary: M-Pesa Daraja STK Push callback (called by Safaricom, not the client)
 *     responses:
 *       200: { description: Callback acknowledged }
 */
router.post('/mpesa/callback', paymentController.mpesaCallback);

/**
 * @openapi
 * /payments/paypal/webhook:
 *   post:
 *     tags: [Payments]
 *     summary: PayPal webhook endpoint (called by PayPal, not the client)
 *     responses:
 *       200: { description: Webhook processed }
 */
router.post('/paypal/webhook', paymentController.paypalWebhook);

// Note: the Stripe webhook route (/payments/stripe/webhook) is registered
// directly in app.ts, BEFORE the global express.json() middleware, because
// Stripe signature verification requires the raw request body.

/**
 * @openapi
 * /payments/coupons/validate:
 *   post:
 *     tags: [Payments]
 *     summary: Validate a coupon code and see its discount before paying
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string }
 *     responses:
 *       200: { description: Coupon is valid }
 *       400: { description: Coupon is invalid, expired, or exhausted }
 */
router.post('/coupons/validate', authenticate, validate(applyCouponSchema), couponController.validateCoupon);

export default router;
