import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from '../lib/errors';

interface ValidationTargets {
  body?: ZodSchema<unknown>;
  params?: ZodSchema<unknown>;
  query?: ZodSchema<unknown>;
}

export function validate(schemas: ValidationTargets) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        const firstError = result.error.errors[0];
        const field = firstError?.path.join('.') ?? undefined;
        next(
          new AppError(
            'VALIDATION_ERROR',
            firstError?.message ?? 'Validation failed',
            400,
            field
          )
        );
        return;
      }
      req.body = result.data;
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        const firstError = result.error.errors[0];
        const field = firstError?.path.join('.') ?? undefined;
        next(
          new AppError(
            'VALIDATION_ERROR',
            firstError?.message ?? 'Validation failed',
            400,
            field
          )
        );
        return;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        const firstError = result.error.errors[0];
        const field = firstError?.path.join('.') ?? undefined;
        next(
          new AppError(
            'VALIDATION_ERROR',
            firstError?.message ?? 'Validation failed',
            400,
            field
          )
        );
        return;
      }
    }

    next();
  };
}
