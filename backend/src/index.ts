import http from 'http';
import { createServer } from './server.js';
import { env } from './config/env.js';
import { socketServer } from './socket/socket.server.js';
import prisma from './db/prisma.js';

const app = createServer();
const httpServer = http.createServer(app);

// Initialize Socket.IO
socketServer.init(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`🎵 TuneScope Backend Server running on port ${env.PORT} (${env.NODE_ENV})`);
  console.log(`🔌 Database connected to PostgreSQL at ${env.DATABASE_URL.replace(/:[^:@]+@/, ':***@')}`);
  console.log(`⚡ Spotify Integration: ${env.SPOTIFY_CLIENT_ID ? 'Configured' : 'Missing Client ID'}`);
});

process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

