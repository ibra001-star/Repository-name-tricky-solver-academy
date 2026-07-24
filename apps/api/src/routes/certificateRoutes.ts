import { Router } from 'express';
import * as certificateController from '../controllers/certificateController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @openapi
 * /certificates/{attemptId}:
 *   get:
 *     tags: [Certificates]
 *     summary: Generate (or fetch an already-generated) certificate for a passed exam attempt
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Certificate returned }
 *       400: { description: Attempt not passed or not fully marked }
 */
router.get('/:attemptId', authenticate, certificateController.getCertificate);

/**
 * @openapi
 * /certificates/downloads/mine:
 *   get:
 *     tags: [Certificates]
 *     summary: List the current user's download history (certificates, receipts, etc.)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Download history returned }
 */
router.get('/downloads/mine', authenticate, certificateController.listMyDownloads);

export default router;
