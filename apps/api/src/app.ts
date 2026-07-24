import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env, isProduction } from './config/env';
import { swaggerSpec } from './config/swagger';
import apiRouter from './routes';
import * as paymentController from './controllers/paymentController';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import { logger } from './config/logger';

export const createApp = (): Express => {
  const app = express();

  // Trust the first proxy hop (Nginx/Render/Railway) so req.ip and secure
  // cookies work correctly behind a reverse proxy.
  app.set('trust proxy', 1);

  // ── Security headers ──────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              imgSrc: ["'self'", 'data:', 'https:'],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
            },
          }
        : false, // relaxed in dev so Swagger UI assets load
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // ── CORS: only the configured frontend origin may call this API with credentials ──
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // ── Stripe webhook: MUST be registered with raw body parsing, and MUST
  // come before the global express.json() below, because Stripe's signature
  // verification (stripe.webhooks.constructEvent) requires the exact raw
  // request bytes — a JSON-parsed-then-restringified body will not match
  // the signature and every webhook would be rejected as forged. ──
  app.post(
    '/api/v1/payments/stripe/webhook',
    express.raw({ type: 'application/json' }),
    paymentController.stripeWebhook
  );

  // ── Body parsing ───────────────────────────────────────────────────
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());

  // ── HTTP Parameter Pollution protection ────────────────────────────
  app.use(hpp());

  // ── Request logging ────────────────────────────────────────────────
  app.use(
    morgan(isProduction ? 'combined' : 'dev', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );

  // ── Rate limiting (general; stricter limits applied per-route for auth) ──
  app.use('/api', generalLimiter);

  // ── API docs ────────────────────────────────────────────────────────
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'Tricky Solver Academy API Docs' }));
  app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

  // ── API routes ──────────────────────────────────────────────────────
  app.use('/api/v1', apiRouter);

  app.get('/', (_req, res) => {
    res.json({ name: 'Tricky Solver Academy API', status: 'running', docs: '/api/docs' });
  });

  // ── 404 + error handling (must be last) ────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
