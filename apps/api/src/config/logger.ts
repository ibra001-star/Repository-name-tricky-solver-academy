import pino from 'pino';
import { isProduction } from './env';

// Structured JSON logging in production (easy to ship to log aggregators),
// pretty-printed in development for readability.
export const logger = pino({
  level: isProduction ? 'info' : 'debug',
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
      },
});
