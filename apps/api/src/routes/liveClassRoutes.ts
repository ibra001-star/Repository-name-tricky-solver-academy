import { Router } from 'express';
import * as liveClassController from '../controllers/liveClassController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createLiveClassSchema, updateLiveClassSchema } from '../utils/validators/scheduleValidators';

const router = Router();

/**
 * @openapi
 * /live-classes:
 *   get:
 *     tags: [Live Classes]
 *     summary: List upcoming published live classes (Zoom sessions and YouTube lessons)
 *     parameters:
 *       - in: query
 *         name: subject
 *         schema: { type: string }
 *     responses:
 *       200: { description: Live classes returned }
 */
router.get('/', liveClassController.listUpcoming);

/**
 * @openapi
 * /live-classes/all:
 *   get:
 *     tags: [Live Classes]
 *     summary: List all live classes including unpublished (teacher/admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Live classes returned }
 */
router.get('/all', authenticate, authorize('TEACHER', 'ADMIN', 'SUPER_ADMIN'), liveClassController.listAllForStaff);

/**
 * @openapi
 * /live-classes:
 *   post:
 *     tags: [Live Classes]
 *     summary: Schedule a new live class or lesson video (teacher/admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, type, joinUrl]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               type: { type: string, enum: [ZOOM, YOUTUBE] }
 *               subjectId: { type: string }
 *               joinUrl: { type: string }
 *               scheduledStart: { type: string, format: date-time }
 *               durationMinutes: { type: integer }
 *     responses:
 *       201: { description: Live class created }
 */
router.post(
  '/',
  authenticate,
  authorize('TEACHER', 'ADMIN', 'SUPER_ADMIN'),
  validate(createLiveClassSchema),
  liveClassController.createLiveClass
);

/**
 * @openapi
 * /live-classes/{id}:
 *   patch:
 *     tags: [Live Classes]
 *     summary: Update or publish a live class (owner or admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Live class updated }
 */
router.patch(
  '/:id',
  authenticate,
  authorize('TEACHER', 'ADMIN', 'SUPER_ADMIN'),
  validate(updateLiveClassSchema),
  liveClassController.updateLiveClass
);

/**
 * @openapi
 * /live-classes/{id}:
 *   delete:
 *     tags: [Live Classes]
 *     summary: Delete a live class (owner or admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Live class deleted }
 */
router.delete('/:id', authenticate, authorize('TEACHER', 'ADMIN', 'SUPER_ADMIN'), liveClassController.deleteLiveClass);

export default router;
