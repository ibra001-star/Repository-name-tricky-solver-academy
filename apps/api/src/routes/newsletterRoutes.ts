import { Router } from 'express';
import * as newsletterController from '../controllers/newsletterController';
import { validate } from '../middleware/validate';
import { subscribeNewsletterSchema } from '../utils/validators/scheduleValidators';

const router = Router();

/**
 * @openapi
 * /newsletter/subscribe:
 *   post:
 *     tags: [Newsletter]
 *     summary: Subscribe an email to the newsletter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200: { description: Subscribed }
 */
router.post('/subscribe', validate(subscribeNewsletterSchema), newsletterController.subscribe);

/**
 * @openapi
 * /newsletter/unsubscribe:
 *   post:
 *     tags: [Newsletter]
 *     summary: Unsubscribe an email from the newsletter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200: { description: Unsubscribed }
 */
router.post('/unsubscribe', validate(subscribeNewsletterSchema), newsletterController.unsubscribe);

export default router;
