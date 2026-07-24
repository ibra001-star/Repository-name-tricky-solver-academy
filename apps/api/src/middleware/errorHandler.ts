import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { logger } from '../config/logger';
import { isProduction } from '../config/env';

// Centralizing error handling means controllers just `throw` and never worry
// about response formatting, and we never leak stack traces or raw DB errors
// to clients in production.
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    if (!err.isOperational) logger.error({ err }, 'Non-operational AppError');
    res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        success: false,
        code: 'DUPLICATE_ENTRY',
        message: `A record with this ${(err.meta?.target as string[])?.join(', ') ?? 'value'} already exists`,
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Record not found' });
      return;
    }
  }

  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');

  res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: isProduction ? 'Something went wrong. Please try again later.' : String(err),
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  });
};
