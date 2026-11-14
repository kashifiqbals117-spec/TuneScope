import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../../middleware/auth.js';
import { socialService } from './social.service.js';
import { analyticsService } from '../analytics/analytics.service.js';
import prisma from '../../db/prisma.js';

export const socialRouter = Router();

/**
 * GET /api/social/friends
 */
socialRouter.get('/friends', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const friends = await socialService.getFriends(req.user!.id);
    res.json(friends);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch friends' });
  }
});

/**
 * GET /api/social/activity
 */
socialRouter.get('/activity', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string || '30', 10);
    const feed = await socialService.getActivityFeed(req.user!.id, limit);
    res.json(feed);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch activity feed' });
  }
});

/**
 * POST /api/social/reactions
 */
socialRouter.post('/reactions', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { trackId, reactionType } = req.body;
    if (!trackId || !reactionType) {
      res.status(400).json({ error: 'trackId and reactionType are required.' });
      return;
    }

    const result = await socialService.toggleReaction(req.user!.id, trackId, reactionType);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to toggle reaction' });
  }
});

/**
 * POST /api/social/friends/request
 */
socialRouter.post('/friends/request', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { usernameOrEmail } = req.body;
    if (!usernameOrEmail) {
      res.status(400).json({ error: 'usernameOrEmail is required.' });
      return;
    }

    const request = await socialService.sendFriendRequest(req.user!.id, usernameOrEmail);
    res.status(201).json({ success: true, request, message: 'Friend request sent!' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to send friend request' });
  }
});

/**
 * POST /api/social/friends/respond
 */
socialRouter.post('/friends/respond', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { friendshipId, accept } = req.body;
    if (!friendshipId || accept === undefined) {
      res.status(400).json({ error: 'friendshipId and accept (boolean) are required.' });
      return;
    }

    const result = await socialService.respondToRequest(req.user!.id, friendshipId, Boolean(accept));
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to respond to friend request' });
  }
});

/**
 * GET /api/social/leaderboards
 */
socialRouter.get('/leaderboards', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const leaderboards = await socialService.getLeaderboards();
    res.json(leaderboards);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch leaderboards' });
  }
});

/**
 * GET /api/social/compare/:targetUserId
 */
socialRouter.get('/compare/:targetUserId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = Array.isArray(req.params.targetUserId) ? req.params.targetUserId[0] : req.params.targetUserId;
    const comparison = await analyticsService.compareTaste(req.user!.id, targetUserId);
    res.json(comparison);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Taste comparison failed' });
  }
});

/**
 * GET /api/social/users/search
 */
socialRouter.get('/users/search', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q || q.length < 2) {
      res.json([]);
      return;
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: req.user!.id } },
          {
            OR: [
              { username: { contains: q, mode: 'insensitive' } },
              { displayName: { contains: q, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        persona: true,
      },
      take: 10,
    });

    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'User search failed' });
  }
});

/**
 * GET /api/social/groups
 */
socialRouter.get('/groups', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const groups = await prisma.friendGroup.findMany({
      include: {
        creator: { select: { id: true, username: true, displayName: true } },
        members: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    const formatted = groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      creatorId: g.creatorId,
      creatorName: g.creator.displayName,
      memberCount: g.members.length,
      members: g.members.map((m) => ({
        userId: m.user.id,
        username: m.user.username,
        displayName: m.user.displayName,
        avatarUrl: m.user.avatarUrl,
        weeklyMinutes: 180,
      })),
      createdAt: g.createdAt.toISOString(),
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch groups' });
  }
});

/**
 * POST /api/social/groups
 */
socialRouter.post('/groups', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Group name is required' });
      return;
    }

    const group = await prisma.friendGroup.create({
      data: {
        name,
        description,
        creatorId: req.user!.id,
        members: {
          create: {
            userId: req.user!.id,
          },
        },
      },
    });

    res.status(201).json(group);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create group' });
  }
});
