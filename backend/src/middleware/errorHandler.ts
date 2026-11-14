import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Never log access tokens or credentials
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'An unexpected server error occurred';

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error] ${req.method} ${req.url}:`, message);
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};

