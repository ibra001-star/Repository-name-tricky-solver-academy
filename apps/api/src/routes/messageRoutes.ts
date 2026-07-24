import { Router } from 'express';
import * as messageController from '../controllers/messageController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendMessageSchema } from '../utils/validators/communityValidators';

const router = Router();

/**
 * @openapi
 * /messages:
 *   post:
 *     tags: [Messages]
 *     summary: Send a direct message to another user
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipientId, body]
 *             properties:
 *               recipientId: { type: string }
 *               body: { type: string }
 *     responses:
 *       201: { description: Message sent }
 */
router.post('/', authenticate, validate(sendMessageSchema), messageController.sendMessage);

/**
 * @openapi
 * /messages/conversations:
 *   get:
 *     tags: [Messages]
 *     summary: List the current user's conversations, most recent first
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Conversations returned }
 */
router.get('/conversations', authenticate, messageController.listConversations);

/**
 * @openapi
 * /messages/conversations/{partnerId}:
 *   get:
 *     tags: [Messages]
 *     summary: Get the full message history with a specific user (marks their messages as read)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Messages returned }
 */
router.get('/conversations/:partnerId', authenticate, messageController.getConversation);

export default router;
