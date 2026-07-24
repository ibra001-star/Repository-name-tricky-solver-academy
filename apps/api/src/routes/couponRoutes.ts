import { Router } from 'express';
import { z } from 'zod';
import * as couponController from '../controllers/couponController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCouponSchema } from '../utils/validators/paymentValidators';

const router = Router();

const setActiveSchema = z.object({ isActive: z.boolean() });

/**
 * @openapi
 * /coupons:
 *   get:
 *     tags: [Coupons]
 *     summary: List all coupons (admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Coupons returned }
 */
router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), couponController.listCoupons);

/**
 * @openapi
 * /coupons:
 *   post:
 *     tags: [Coupons]
 *     summary: Create a new discount coupon (admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, discountPercent]
 *             properties:
 *               code: { type: string, example: "KCSE2026" }
 *               discountPercent: { type: integer, example: 20 }
 *               maxUses: { type: integer }
 *               expiresAt: { type: string, format: date-time }
 *     responses:
 *       201: { description: Coupon created }
 *       409: { description: Coupon code already exists }
 */
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate(createCouponSchema), couponController.createCoupon);

/**
 * @openapi
 * /coupons/{id}/active:
 *   patch:
 *     tags: [Coupons]
 *     summary: Activate or deactivate a coupon (admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isActive]
 *             properties:
 *               isActive: { type: boolean }
 *     responses:
 *       200: { description: Coupon updated }
 */
router.patch(
  '/:id/active',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(setActiveSchema),
  couponController.setCouponActive
);

export default router;
