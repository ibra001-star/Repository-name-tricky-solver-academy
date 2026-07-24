import { Router } from 'express';
import * as referralController from '../controllers/referralController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @openapi
 * /referrals/code:
 *   get:
 *     tags: [Referrals]
 *     summary: Get (or lazily generate) the current user's referral code
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Referral code returned }
 */
router.get('/code', authenticate, referralController.getMyReferralCode);

/**
 * @openapi
 * /referrals/stats:
 *   get:
 *     tags: [Referrals]
 *     summary: Get the current user's referral stats (who they referred, rewards earned)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Referral stats returned }
 */
router.get('/stats', authenticate, referralController.getMyReferralStats);

export default router;
