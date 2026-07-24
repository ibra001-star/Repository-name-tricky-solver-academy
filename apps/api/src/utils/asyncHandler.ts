import { NextFunction, Request, Response } from 'express';

// Wraps async route handlers so rejected promises are forwarded to Express's
// error-handling middleware instead of crashing the process or hanging the request.
type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler = (fn: AsyncFn) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
