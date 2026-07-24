import { Router } from 'express';
import { z } from 'zod';
import * as forumController from '../controllers/forumController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validate';
import {
  createThreadSchema,
  createPostSchema,
  listThreadsQuerySchema,
} from '../utils/validators/communityValidators';

const router = Router();

const moderateSchema = z.object({ isPinned: z.boolean().optional(), isLocked: z.boolean().optional() });

/**
 * @openapi
 * /forum/threads:
 *   get:
 *     tags: [Forum]
 *     summary: List forum threads (pinned first, then most recently active)
 *     parameters:
 *       - in: query
 *         name: subject
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Threads returned }
 */
router.get('/threads', validateQuery(listThreadsQuerySchema), forumController.listThreads);

/**
 * @openapi
 * /forum/threads/{id}:
 *   get:
 *     tags: [Forum]
 *     summary: Get a thread with all its posts (increments view count)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Thread returned }
 *       404: { description: Thread not found }
 */
router.get('/threads/:id', forumController.getThread);

/**
 * @openapi
 * /forum/threads:
 *   post:
 *     tags: [Forum]
 *     summary: Create a new discussion thread
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, body]
 *             properties:
 *               title: { type: string }
 *               body: { type: string }
 *               subjectId: { type: string }
 *     responses:
 *       201: { description: Thread created }
 */
router.post('/threads', authenticate, validate(createThreadSchema), forumController.createThread);

/**
 * @openapi
 * /forum/threads/{id}/posts:
 *   post:
 *     tags: [Forum]
 *     summary: Reply to a thread
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
 *             required: [body]
 *             properties:
 *               body: { type: string }
 *     responses:
 *       201: { description: Reply posted }
 *       400: { description: Thread is locked }
 */
router.post('/threads/:id/posts', authenticate, validate(createPostSchema), forumController.createPost);

/**
 * @openapi
 * /forum/threads/{id}:
 *   delete:
 *     tags: [Forum]
 *     summary: Delete a thread (owner or admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Thread deleted }
 */
router.delete('/threads/:id', authenticate, forumController.deleteThread);

/**
 * @openapi
 * /forum/posts/{id}:
 *   delete:
 *     tags: [Forum]
 *     summary: Delete a post (owner or admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Post deleted }
 */
router.delete('/posts/:id', authenticate, forumController.deletePost);

/**
 * @openapi
 * /forum/threads/{id}/moderate:
 *   patch:
 *     tags: [Forum]
 *     summary: Pin/unpin or lock/unlock a thread (admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isPinned: { type: boolean }
 *               isLocked: { type: boolean }
 *     responses:
 *       200: { description: Thread moderation updated }
 */
router.patch(
  '/threads/:id/moderate',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(moderateSchema),
  forumController.moderateThread
);

export default router;
