import { PrismaClient } from '@prisma/client';
import { isProduction } from './env';

// A single PrismaClient instance is reused across the app to avoid
// exhausting Postgres connections, especially important under
// hot-reload in development.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: isProduction ? ['error', 'warn'] : ['query', 'error', 'warn'],
  });

if (!isProduction) {
  global.__prisma = prisma;
}
