import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend/.env or root .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://127.0.0.1:5173',
  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://127.0.0.1:5173,http://localhost:5173').split(','),
  
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:kashif._.0611@127.0.0.1:5432/tunescope?schema=public',
  TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://postgres:kashif._.0611@127.0.0.1:5432/tunescope_test?schema=public',
  
  JWT_SECRET: process.env.JWT_SECRET || 'tunescope-super-secure-jwt-secret-key-32-chars-min!',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Official Spotify OAuth configuration
  SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID || '',
  SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET || '',
  SPOTIFY_REDIRECT_URI: process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:5000/api/spotify/callback',
  SPOTIFY_SCOPES: process.env.SPOTIFY_SCOPES || 'user-read-recently-played user-top-read user-read-playback-state user-read-currently-playing user-read-email user-read-private',
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200', 10),
};

