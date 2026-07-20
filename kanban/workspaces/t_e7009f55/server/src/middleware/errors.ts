import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { validateRequest, type SchemaName } from '@mern-3dviz/shared';
import { logger } from '../config/logger';

export class HttpError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: { code: 'route/not-found', message: 'Route not found' } });
}

/** Centralized error handler. Last middleware in the chain. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details as Record<string, unknown> | undefined } });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({ error: { code: 'validation/zod', message: 'Invalid request', details: { issues: err.issues } } });
    return;
  }
  logger.error({ err, path: req.path, method: req.method }, 'unhandled error');
  res.status(500).json({ error: { code: 'server/internal', message: 'Internal server error' } });
}

/** Validate request body against a shared JSON Schema. */
export function validateBody(schemaName: SchemaName) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = validateRequest(schemaName, req.body);
    if (result.ok) {
      next();
      return;
    }
    res.status(400).json({ error: { code: 'validation/json-schema', message: 'Invalid request body', details: { errors: result.errors } } });
  };
}

/** Async route wrapper that funnels rejections into the error handler. */
export function asyncHandler<TReq extends Request = Request, TRes extends Response = Response>(
  fn: (req: TReq, res: TRes, next: NextFunction) => Promise<unknown>
) {
  return (req: TReq, res: TRes, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}