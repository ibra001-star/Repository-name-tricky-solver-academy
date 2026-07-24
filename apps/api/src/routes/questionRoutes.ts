import { Router } from 'express';
import * as questionController from '../controllers/questionController';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validate';
import {
  createQuestionSchema,
  updateQuestionSchema,
  approveQuestionSchema,
  listQuestionsQuerySchema,
} from '../utils/validators/questionValidators';

const router = Router();

/**
 * @openapi
 * /questions:
 *   get:
 *     tags: [Questions]
 *     summary: Browse the question bank with filters, search, and pagination
 *     parameters:
 *       - in: query
 *         name: subject
 *         schema: { type: string }
 *         description: Subject slug
 *       - in: query
 *         name: topic
 *         schema: { type: string }
 *         description: Topic slug
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: difficulty
 *         schema: { type: string, enum: [EASY, MEDIUM, HARD] }
 *       - in: query
 *         name: curriculum
 *         schema: { type: string, enum: [CBC, KCSE] }
 *       - in: query
 *         name: form
 *         schema: { type: integer }
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *       - in: query
 *         name: tags
 *         schema: { type: string }
 *         description: Comma-separated tags
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: random
 *         schema: { type: boolean }
 *         description: Return a random sample instead of paginated results
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Paginated list of questions returned }
 */
router.get('/', optionalAuthenticate, validateQuery(listQuestionsQuerySchema), questionController.listQuestions);

/**
 * @openapi
 * /questions/bookmarks:
 *   get:
 *     tags: [Questions]
 *     summary: List the current user's bookmarked questions
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Bookmarked questions returned }
 */
router.get('/bookmarks', authenticate, questionController.listBookmarks);

/**
 * @openapi
 * /questions/pending:
 *   get:
 *     tags: [Questions]
 *     summary: List questions awaiting approval (admin review queue)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Pending questions returned }
 *       403: { description: Insufficient permissions }
 */
router.get('/pending', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), questionController.listPending);

/**
 * @openapi
 * /questions/{id}:
 *   get:
 *     tags: [Questions]
 *     summary: Get a single question by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Question returned }
 *       404: { description: Question not found }
 */
router.get('/:id', optionalAuthenticate, questionController.getQuestion);

/**
 * @openapi
 * /questions:
 *   post:
 *     tags: [Questions]
 *     summary: Create a new question (teacher/admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subjectId, topicId, type, content, solution]
 *             properties:
 *               subjectId: { type: string }
 *               topicId: { type: string }
 *               type: { type: string, enum: [MULTIPLE_CHOICE, STRUCTURED, FILL_IN_BLANK, MATCHING, ESSAY, CALCULATION, GRAPH, IMAGE_BASED] }
 *               difficulty: { type: string, enum: [EASY, MEDIUM, HARD] }
 *               curriculum: { type: string, enum: [CBC, KCSE] }
 *               form: { type: integer }
 *               year: { type: integer }
 *               marks: { type: integer }
 *               tags: { type: array, items: { type: string } }
 *               content: { type: object }
 *               solution: { type: object }
 *     responses:
 *       201: { description: Question created }
 */
router.post(
  '/',
  authenticate,
  authorize('TEACHER', 'ADMIN', 'SUPER_ADMIN'),
  validate(createQuestionSchema),
  questionController.createQuestion
);

/**
 * @openapi
 * /questions/{id}:
 *   patch:
 *     tags: [Questions]
 *     summary: Update a question (owner teacher or admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Question updated }
 *       403: { description: Not the owner }
 *       404: { description: Question not found }
 */
router.patch(
  '/:id',
  authenticate,
  authorize('TEACHER', 'ADMIN', 'SUPER_ADMIN'),
  validate(updateQuestionSchema),
  questionController.updateQuestion
);

/**
 * @openapi
 * /questions/{id}:
 *   delete:
 *     tags: [Questions]
 *     summary: Delete a question (owner teacher or admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Question deleted }
 */
router.delete('/:id', authenticate, authorize('TEACHER', 'ADMIN', 'SUPER_ADMIN'), questionController.deleteQuestion);

/**
 * @openapi
 * /questions/{id}/approve:
 *   patch:
 *     tags: [Questions]
 *     summary: Approve or reject a pending question (admin)
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
 *             required: [isApproved]
 *             properties:
 *               isApproved: { type: boolean }
 *     responses:
 *       200: { description: Approval status updated }
 */
router.patch(
  '/:id/approve',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(approveQuestionSchema),
  questionController.setApproval
);

/**
 * @openapi
 * /questions/{id}/bookmark:
 *   post:
 *     tags: [Questions]
 *     summary: Toggle bookmark on a question for the current user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Bookmark toggled }
 */
router.post('/:id/bookmark', authenticate, questionController.toggleBookmark);

export default router;
