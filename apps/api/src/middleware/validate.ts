import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

// Accepts any Zod schema, not just plain ZodObject — schemas built with
// .refine()/.superRefine()/.transform() (as used by createLiveClassSchema,
// for instance) return a ZodEffects wrapper, which is a valid parseable
// schema but not assignable to the narrower AnyZodObject type.
type AnyZodSchema = z.ZodType<unknown, z.ZodTypeDef, unknown>;

// Validates and coerces req.body against a Zod schema, so controllers can
// trust `req.body` is already shaped correctly.
export const validate = (schema: AnyZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.body = schema.parse(req.body);
    next();
  };
};

// Same idea but for req.query — used by list/search endpoints with filters,
// pagination, etc. Express's req.query is technically read-only typed, so we
// reassign via Object.assign to keep the same object reference.
export const validateQuery = (schema: AnyZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.parse(req.query);
    Object.assign(req.query as object, parsed as object);
    req.validatedQuery = parsed;
    next();
  };
};
