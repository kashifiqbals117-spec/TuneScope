import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
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

  // CORS Configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or server-to-server)
        if (!origin) return callback(null, true);
        if (env.CORS_ORIGINS.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
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

  // Global Rate Limiting
  app.use('/api/', apiLimiter);

  // Healthcheck endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      app: 'TuneScope API',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

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

