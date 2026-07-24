import { Router } from 'express';
import * as subjectController from '../controllers/subjectController';

const router = Router();

/**
 * @openapi
 * /subjects:
 *   get:
 *     tags: [Subjects]
 *     summary: List all active subjects
 *     responses:
 *       200: { description: List of subjects returned }
 */
router.get('/', subjectController.listSubjects);

/**
 * @openapi
 * /subjects/{slug}:
 *   get:
 *     tags: [Subjects]
 *     summary: Get a subject and its topic tree by slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Subject returned }
 *       404: { description: Subject not found }
 */
router.get('/:slug', subjectController.getSubjectBySlug);

export default router;
