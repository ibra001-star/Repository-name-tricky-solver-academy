import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';

// Augment Express's Request type so `req.user` is typed everywhere downstream.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: Role; email: string };
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw AppError.unauthorized('Missing or malformed authorization header');
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch {
    throw AppError.unauthorized('Invalid or expired access token');
  }
};

// Attaches req.user if a valid token is present, but does not fail the
// request otherwise. Useful for routes that behave differently for
// guests vs logged-in users (e.g. showing a "buy" vs "download" button).
export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();

  try {
    const payload = verifyAccessToken(header.slice('Bearer '.length));
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
  } catch {
    // ignore invalid token for optional auth
  }
  next();
};

// Role-based access control: usage `authorize('ADMIN', 'SUPER_ADMIN')`
export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw AppError.forbidden('You do not have permission to perform this action');
    }
    next();
  };
};
