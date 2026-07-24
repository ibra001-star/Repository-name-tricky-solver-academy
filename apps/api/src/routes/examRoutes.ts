import { Router } from 'express';
import * as examController from '../controllers/examController';
import * as attemptController from '../controllers/examAttemptController';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validate';
import {
  createExamSchema,
  updateExamSchema,
  publishExamSchema,
  listExamsQuerySchema,
  saveAnswerSchema,
  submitAttemptSchema,
} from '../utils/validators/examValidators';

const router = Router();

/**
 * @openapi
 * /exams:
 *   get:
 *     tags: [Exams]
 *     summary: List exams (published only for students; all for staff)
 *     parameters:
 *       - in: query
 *         name: subject
 *         schema: { type: string }
 *       - in: query
 *         name: examType
 *         schema: { type: string }
 *       - in: query
 *         name: curriculum
 *         schema: { type: string }
 *       - in: query
 *         name: form
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Paginated exams returned }
 */
router.get('/', optionalAuthenticate, validateQuery(listExamsQuerySchema), examController.listExams);

/**
 * @openapi
 * /exams/{id}/take:
 *   get:
 *     tags: [Exams]
 *     summary: Get exam questions for taking (answer key stripped)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Exam ready for taking }
 *       404: { description: Exam not found or unpublished }
 */
router.get('/:id/take', optionalAuthenticate, examController.getExamForTaking);

/**
 * @openapi
 * /exams/leaderboard:
 *   get:
 *     tags: [Exams]
 *     summary: Get the platform-wide leaderboard (ranked by average score, minimum 3 marked attempts)
 *     responses:
 *       200: { description: Platform leaderboard returned }
 */
router.get('/leaderboard', attemptController.getPlatformLeaderboard);

/**
 * @openapi
 * /exams/{id}/leaderboard:
 *   get:
 *     tags: [Exams]
 *     summary: Get the top scorers for an exam
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Leaderboard returned }
 */
router.get('/:id/leaderboard', attemptController.getLeaderboard);

/**
 * @openapi
 * /exams/{id}/attempts:
 *   post:
 *     tags: [Exams]
 *     summary: Start (or resume) an exam attempt
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Attempt started or resumed }
 *       404: { description: Exam not found }
 */
router.post('/:id/attempts', authenticate, attemptController.startAttempt);

/**
 * @openapi
 * /exams/attempts/mine:
 *   get:
 *     tags: [Exams]
 *     summary: List the current user's exam attempts
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Attempts returned }
 */
router.get('/attempts/mine', authenticate, attemptController.listMyAttempts);

/**
 * @openapi
 * /exams/attempts/{attemptId}/autosave:
 *   patch:
 *     tags: [Exams]
 *     summary: Autosave a single answer during an in-progress attempt
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [questionId, response]
 *             properties:
 *               questionId: { type: string }
 *               response: {}
 *     responses:
 *       200: { description: Answer saved }
 */
router.patch('/attempts/:attemptId/autosave', authenticate, validate(saveAnswerSchema), attemptController.autosaveAnswer);

/**
 * @openapi
 * /exams/attempts/{attemptId}/submit:
 *   post:
 *     tags: [Exams]
 *     summary: Submit an attempt for instant marking
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Attempt submitted and marked }
 */
router.post('/attempts/:attemptId/submit', authenticate, validate(submitAttemptSchema), attemptController.submitAttempt);

/**
 * @openapi
 * /exams/attempts/{attemptId}/result:
 *   get:
 *     tags: [Exams]
 *     summary: Get the full result of a submitted attempt (with solutions)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Result returned }
 */
router.get('/attempts/:attemptId/result', authenticate, attemptController.getAttemptResult);

/**
 * @openapi
 * /exams:
 *   post:
 *     tags: [Exams]
 *     summary: Create an exam from a set of questions (teacher/admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, subjectId, examType, durationMinutes, questionIds]
 *             properties:
 *               title: { type: string }
 *               subjectId: { type: string }
 *               examType: { type: string }
 *               durationMinutes: { type: integer }
 *               questionIds: { type: array, items: { type: string } }
 *     responses:
 *       201: { description: Exam created }
 */
router.post('/', authenticate, authorize('TEACHER', 'ADMIN', 'SUPER_ADMIN'), validate(createExamSchema), examController.createExam);

/**
 * @openapi
 * /exams/{id}:
 *   patch:
 *     tags: [Exams]
 *     summary: Update an exam (owner teacher or admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Exam updated }
 */
router.patch('/:id', authenticate, authorize('TEACHER', 'ADMIN', 'SUPER_ADMIN'), validate(updateExamSchema), examController.updateExam);

/**
 * @openapi
 * /exams/{id}/publish:
 *   patch:
 *     tags: [Exams]
 *     summary: Publish or unpublish an exam (admin)
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
 *             required: [isPublished]
 *             properties:
 *               isPublished: { type: boolean }
 *     responses:
 *       200: { description: Publish status updated }
 */
router.patch('/:id/publish', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate(publishExamSchema), examController.setPublished);

/**
 * @openapi
 * /exams/{id}:
 *   delete:
 *     tags: [Exams]
 *     summary: Delete an exam (owner teacher or admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Exam deleted }
 */
router.delete('/:id', authenticate, authorize('TEACHER', 'ADMIN', 'SUPER_ADMIN'), examController.deleteExam);

export default router;
