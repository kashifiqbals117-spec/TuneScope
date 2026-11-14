import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { prisma } from './db/prisma.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { spotifyRouter } from './modules/spotify/spotify.routes.js';
import { analyticsRouter } from './modules/analytics/analytics.routes.js';
import { socialRouter } from './modules/social/social.routes.js';
import { recapsRouter } from './modules/recaps/recaps.routes.js';
import { musicRouter } from './modules/music/music.routes.js';

export function createServer() {
  const app = express();

  // Security Headers Middleware
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  // CORS Configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or server-to-server)
        if (!origin) return callback(null, true);
        if (
          env.CORS_ORIGINS.includes(origin) ||
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:') ||
          origin.endsWith('.vercel.app')
        ) {
          return callback(null, true);
        }
        return callback(new Error('CORS policy: origin not allowed.'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Global Rate Limiting on API endpoints
  app.use('/api/', apiLimiter);

  // Healthcheck handler verifying live database connectivity
  const healthHandler = async (_req: express.Request, res: express.Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        status: 'healthy',
        app: 'TuneScope API',
        database: 'connected',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      });
    } catch {
      res.status(503).json({
        status: 'unhealthy',
        app: 'TuneScope API',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      });
    }
  };

  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);

  // Mount API modules
  app.use('/api/auth', authRouter);
  app.use('/api/spotify', spotifyRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/social', socialRouter);
  app.use('/api/recaps', recapsRouter);
  app.use('/api/music', musicRouter);

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}
