import { Router } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Service and database health check
 *     responses:
 *       200: { description: Service is healthy }
 *       503: { description: Database unreachable }
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ success: true, status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
    } catch {
      res.status(503).json({ success: false, status: 'degraded', database: 'unreachable' });
    }
  })
);

export default router;
