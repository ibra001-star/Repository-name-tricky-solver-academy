import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/prisma';
import { startReminderScheduler, stopReminderScheduler } from './services/reminderSchedulerService';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Tricky Solver Academy API running on port ${env.PORT} [${env.NODE_ENV}]`);
  logger.info(`📚 API docs available at http://localhost:${env.PORT}/api/docs`);
});

// Background jobs (study plan reminders) run in-process — appropriate at
// this project's scale (single or a few API instances). A larger
// deployment would move this to a dedicated worker to avoid every replica
// running the same cron independently.
if (!process.env.DISABLE_SCHEDULER) {
  startReminderScheduler();
}

// Graceful shutdown: stop accepting new connections, close the DB pool,
// then exit. Important for zero-downtime deploys on Render/Railway/Docker.
const shutdown = async (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  stopReminderScheduler();
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Shutdown complete.');
    process.exit(0);
  });

  // Force-exit if graceful shutdown hangs for more than 10s
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled Promise Rejection');
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught Exception — shutting down');
  process.exit(1);
});
