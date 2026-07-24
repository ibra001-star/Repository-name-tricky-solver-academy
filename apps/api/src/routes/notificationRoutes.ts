import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List the current user's notifications
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Notifications returned }
 */
router.get('/', authenticate, notificationController.listMyNotifications);

/**
 * @openapi
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a single notification as read
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Notification marked as read }
 */
router.patch('/:id/read', authenticate, notificationController.markAsRead);

/**
 * @openapi
 * /notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all of the current user's notifications as read
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: All notifications marked as read }
 */
router.patch('/read-all', authenticate, notificationController.markAllAsRead);

export default router;
