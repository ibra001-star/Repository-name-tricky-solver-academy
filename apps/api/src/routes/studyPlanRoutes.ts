import { Router } from 'express';
import * as studyPlanController from '../controllers/studyPlanController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createStudyPlanItemSchema, updateStudyPlanItemSchema } from '../utils/validators/scheduleValidators';

const router = Router();

/**
 * @openapi
 * /study-plan:
 *   get:
 *     tags: [Study Plan]
 *     summary: List the current user's study plan items
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200: { description: Study plan items returned }
 */
router.get('/', authenticate, studyPlanController.listMyPlanItems);

/**
 * @openapi
 * /study-plan:
 *   post:
 *     tags: [Study Plan]
 *     summary: Add an item to the current user's revision timetable
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, scheduledFor]
 *             properties:
 *               title: { type: string }
 *               subjectId: { type: string }
 *               scheduledFor: { type: string, format: date-time }
 *               notes: { type: string }
 *     responses:
 *       201: { description: Study plan item created }
 */
router.post('/', authenticate, validate(createStudyPlanItemSchema), studyPlanController.createPlanItem);

/**
 * @openapi
 * /study-plan/{id}:
 *   patch:
 *     tags: [Study Plan]
 *     summary: Update or mark complete a study plan item
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Study plan item updated }
 */
router.patch('/:id', authenticate, validate(updateStudyPlanItemSchema), studyPlanController.updatePlanItem);

/**
 * @openapi
 * /study-plan/{id}:
 *   delete:
 *     tags: [Study Plan]
 *     summary: Delete a study plan item
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Study plan item deleted }
 */
router.delete('/:id', authenticate, studyPlanController.deletePlanItem);

export default router;
