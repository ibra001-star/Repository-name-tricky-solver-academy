// Augments Express's Request type with a `validatedQuery` field populated
// by the validateQuery middleware, so controllers get a typed, parsed query
// object instead of re-parsing req.query themselves.
import 'express';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      validatedQuery?: unknown;
    }
  }
}

export {};
