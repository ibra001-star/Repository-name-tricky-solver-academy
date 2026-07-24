import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validate';
import {
  listUsersQuerySchema,
  setUserActiveSchema,
  setUserRoleSchema,
  listAuditLogsQuerySchema,
} from '../utils/validators/adminValidators';

const router = Router();

router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

/**
 * @openapi
 * /admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Platform-wide overview stats for the admin dashboard
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Stats returned }
 */
router.get('/stats', adminController.getPlatformStats);

/**
 * @openapi
 * /admin/revenue:
 *   get:
 *     tags: [Admin]
 *     summary: Revenue summary broken down by provider, purpose, and subscription plan
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Revenue summary returned }
 */
router.get('/revenue', adminController.getRevenueSummary);

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List and search users
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: role
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
 *       200: { description: Users returned }
 */
router.get('/users', validateQuery(listUsersQuerySchema), adminController.listUsers);

/**
 * @openapi
 * /admin/users/{id}/active:
 *   patch:
 *     tags: [Admin]
 *     summary: Activate or deactivate a user account
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
 *             required: [isActive]
 *             properties:
 *               isActive: { type: boolean }
 *     responses:
 *       200: { description: User updated }
 */
router.patch('/users/:id/active', validate(setUserActiveSchema), adminController.setUserActive);

/**
 * @openapi
 * /admin/users/{id}/role:
 *   patch:
 *     tags: [Admin]
 *     summary: Change a user's role (granting ADMIN/SUPER_ADMIN requires super admin)
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
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [STUDENT, TEACHER, ADMIN, SUPER_ADMIN] }
 *     responses:
 *       200: { description: User role updated }
 *       403: { description: Insufficient privileges to grant this role }
 */
router.patch('/users/:id/role', validate(setUserRoleSchema), adminController.setUserRole);

/**
 * @openapi
 * /admin/audit-logs:
 *   get:
 *     tags: [Admin]
 *     summary: List audit log entries
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Audit logs returned }
 */
router.get('/audit-logs', validateQuery(listAuditLogsQuerySchema), adminController.listAuditLogs);

export default router;
