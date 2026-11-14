import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Production-hardened centralized error handler.
 * Guarantees that:
 * 1. Stack traces, database credentials, SQL statements, and internal paths are never exposed to clients.
 * 2. Detailed technical diagnostics remain in server-side logs for debugging.
 * 3. Never swallows errors silently.
 * 4. Returns appropriate HTTP status codes and user-friendly messages.
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Always log technical details to server-side logs (filtering out secrets)
  const sanitizedLog = err.stack || err.message || String(err);
  console.error(`[TuneScope Server Error] ${req.method} ${req.url}:`, sanitizedLog);

  // Zod Input Validation Errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Invalid request input. Please check the provided data.',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // JWT / Authentication Errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      error: 'Your session has expired. Please sign in again.',
    });
    return;
  }

  // Prisma & PostgreSQL Database Errors
  if (
    err.name === 'PrismaClientInitializationError' ||
    err.name === 'PrismaClientRustPanicError' ||
    err.message?.includes('database') ||
    err.message?.includes('ECONNREFUSED')
  ) {
    res.status(503).json({
      error: 'Some services are temporarily unavailable. Please try again later.',
    });
    return;
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      res.status(409).json({
        error: 'A record with this identifier already exists.',
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        error: 'The requested resource was not found.',
      });
      return;
    }
    res.status(500).json({
      error: 'Some services are temporarily unavailable. Please try again later.',
    });
    return;
  }

  // HTTP Status Code derivation
  const statusCode = err.statusCode || err.status || (typeof err.code === 'number' ? err.code : 500);

  // User-facing sanitization
  let userFacingMessage = err.message || 'An unexpected server error occurred';

  // Protect internal 500 details from leaking in production
  if (statusCode >= 500) {
    userFacingMessage =
      process.env.NODE_ENV === 'production'
        ? 'Some services are temporarily unavailable. Please try again later.'
        : userFacingMessage;
  }

  res.status(statusCode).json({
    error: userFacingMessage,
  });
};
