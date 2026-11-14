import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../../db/prisma.js';
import { env } from '../../config/env.js';
import { requireAuth, AuthRequest } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rateLimit.js';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(50),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const profileUpdateSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(250).optional().nullable(),
  persona: z.string().max(100).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable().or(z.literal('')),
  privacySetting: z.enum(['PUBLIC', 'FRIENDS_ONLY', 'PRIVATE']).optional(),
});

function generateToken(user: { id: string; email: string; username: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * POST /api/auth/register
 */
authRouter.post('/register', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = registerSchema.parse(req.body);

    const existingEmail = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });
    if (existingEmail) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: validated.username.toLowerCase() },
    });
    if (existingUsername) {
      res.status(409).json({ error: 'This username is already taken.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validated.password, salt);

    const user = await prisma.user.create({
      data: {
        email: validated.email.toLowerCase(),
        passwordHash,
        username: validated.username.toLowerCase(),
        displayName: validated.displayName,
        persona: 'The Sonic Pioneer',
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        persona: true,
        privacySetting: true,
        createdAt: true,
      },
    });

    const token = generateToken(user);

    res.status(201).json({
      user,
      token,
      message: 'Account created successfully!',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: error.message || 'Registration failed.' });
  }
});

/**
 * POST /api/auth/login
 */
authRouter.post('/login', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(user);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        persona: user.persona,
        privacySetting: user.privacySetting,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: error.message || 'Login failed.' });
  }
});

/**
 * GET /api/auth/me
 */
authRouter.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        connections: {
          select: {
            id: true,
            provider: true,
            isConnected: true,
            providerUserId: true,
            scope: true,
            lastSyncedAt: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch user' });
  }
});

/**
 * PATCH /api/auth/profile
 */
authRouter.patch('/profile', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = profileUpdateSchema.parse(req.body);

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(validated.displayName && { displayName: validated.displayName }),
        ...(validated.bio !== undefined && { bio: validated.bio }),
        ...(validated.persona !== undefined && { persona: validated.persona }),
        ...(validated.avatarUrl !== undefined && { avatarUrl: validated.avatarUrl }),
        ...(validated.privacySetting && { privacySetting: validated.privacySetting }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        persona: true,
        privacySetting: true,
      },
    });

    res.json({ user: updated, message: 'Profile updated successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

/**
 * POST /api/auth/demo-login
 * Instantly logs in as the primary pre-seeded demo user (Alex)
 */
authRouter.post('/demo-login', async (_req: Request, res: Response): Promise<void> => {
  try {
    let demoUser = await prisma.user.findUnique({
      where: { email: 'alex@tunescope.app' },
    });

    if (!demoUser) {
      // Create if seed has not run yet
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('tunescope2026', salt);
      demoUser = await prisma.user.create({
        data: {
          email: 'alex@tunescope.app',
          passwordHash: hash,
          username: 'alex_music',
          displayName: 'Alex Mercer',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          bio: 'Synthesizing frequencies & late night electronic grooves. 🌌',
          persona: 'The Cosmic Explorer',
          privacySetting: 'PUBLIC',
        },
      });
    }

    const token = generateToken(demoUser);

    res.json({
      user: {
        id: demoUser.id,
        email: demoUser.email,
        username: demoUser.username,
        displayName: demoUser.displayName,
        avatarUrl: demoUser.avatarUrl,
        bio: demoUser.bio,
        persona: demoUser.persona,
        privacySetting: demoUser.privacySetting,
        createdAt: demoUser.createdAt,
      },
      token,
      isDemo: true,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Demo login failed' });
  }
});

