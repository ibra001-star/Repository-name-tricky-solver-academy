import { Router } from 'express';
import * as uploadController from '../controllers/uploadController';
import { authenticate, authorize } from '../middleware/auth';
import { uploadDocument } from '../middleware/upload';

const router = Router();

/**
 * @openapi
 * /uploads:
 *   get:
 *     tags: [Uploads]
 *     summary: List approved teacher uploads (public revision material)
 *     parameters:
 *       - in: query
 *         name: subjectArea
 *         schema: { type: string }
 *     responses:
 *       200: { description: Approved uploads returned }
 */
router.get('/', uploadController.listApprovedUploads);

/**
 * @openapi
 * /uploads:
 *   post:
 *     tags: [Uploads]
 *     summary: Upload a revision paper or marking scheme (teacher/admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, title, subjectArea]
 *             properties:
 *               file: { type: string, format: binary }
 *               title: { type: string }
 *               subjectArea: { type: string }
 *     responses:
 *       201: { description: Upload created, pending review }
 */
router.post(
  '/',
  authenticate,
  authorize('TEACHER', 'ADMIN', 'SUPER_ADMIN'),
  uploadDocument,
  uploadController.createUpload
);

/**
 * @openapi
 * /uploads/mine:
 *   get:
 *     tags: [Uploads]
 *     summary: List the current teacher's uploads (any status)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Uploads returned }
 */
router.get('/mine', authenticate, authorize('TEACHER', 'ADMIN', 'SUPER_ADMIN'), uploadController.listMyUploads);

/**
 * @openapi
 * /uploads/pending:
 *   get:
 *     tags: [Uploads]
 *     summary: List uploads awaiting admin review
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Pending uploads returned }
 */
router.get('/pending', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), uploadController.listPendingUploads);

/**
 * @openapi
 * /uploads/{id}/review:
 *   patch:
 *     tags: [Uploads]
 *     summary: Approve or reject a pending upload (admin)
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
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [APPROVED, REJECTED] }
 *               reviewNotes: { type: string }
 *     responses:
 *       200: { description: Upload reviewed }
 */
router.patch('/:id/review', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), uploadController.reviewUpload);

/**
 * @openapi
 * /uploads/{id}:
 *   delete:
 *     tags: [Uploads]
 *     summary: Delete an upload (owner teacher or admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Upload deleted }
 */
router.delete('/:id', authenticate, authorize('TEACHER', 'ADMIN', 'SUPER_ADMIN'), uploadController.deleteUpload);

export default router;
