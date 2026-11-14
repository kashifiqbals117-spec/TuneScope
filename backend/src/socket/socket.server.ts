import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

class SocketServer {
  private io: SocketIOServer | null = null;
  private onlineUsers = new Map<string, string>(); // userId -> socketId

  public init(httpServer: HttpServer): SocketIOServer {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: env.CORS_ORIGINS,
        credentials: true,
      },
    });

    this.io.use((socket: Socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      try {
        const decoded = jwt.verify(token as string, env.JWT_SECRET) as {
          id: string;
          username: string;
        };
        (socket as any).userId = decoded.id;
        (socket as any).username = decoded.username;
        next();
      } catch (err) {
        next(new Error('Invalid token'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const userId = (socket as any).userId;
      const username = (socket as any).username;

      if (userId) {
        this.onlineUsers.set(userId, socket.id);
        socket.join(`user:${userId}`);
        this.broadcast('friend:online', { userId, username });
      }

      // Live playback heartbeat from frontend or Spotify poll
      socket.on('playback:update', (data) => {
        this.broadcast('activity:live_track', {
          userId,
          username,
          track: data.track,
          isPlaying: data.isPlaying,
          timestamp: new Date().toISOString(),
        });
      });

      socket.on('disconnect', () => {
        if (userId) {
          this.onlineUsers.delete(userId);
          this.broadcast('friend:offline', { userId });
        }
      });
    });

    return this.io;
  }

  public broadcast(event: string, payload: any): void {
    if (this.io) {
      this.io.emit(event, payload);
    }
  }

  public emitToUser(userId: string, event: string, payload: any): void {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, payload);
    }
  }

  public isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }
}

export const socketServer = new SocketServer();

