import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import prisma from '../db/prisma.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    displayName: string;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required. Please provide a valid Bearer token.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'Token missing.' });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      email: string;
      username: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: 'User no longer exists.' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Optional auth for public routes that can be personalized
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, env.JWT_SECRET) as {
          id: string;
          email: string;
          username: string;
        };
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, email: true, username: true, displayName: true },
        });
        if (user) {
          req.user = user;
        }
      }
    }
  } catch {
    // Continue unauthenticated
  }
  next();
};

