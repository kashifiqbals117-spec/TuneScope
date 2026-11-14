import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../../middleware/auth.js';
import { analyticsService } from './analytics.service.js';

export const analyticsRouter = Router();

/**
 * GET /api/analytics/summary
 */
analyticsRouter.get('/summary', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const period = (req.query.period as 'all' | 'year' | 'month' | 'week') || 'all';
    const summary = await analyticsService.getAnalyticsSummary(req.user!.id, period);
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch analytics summary' });
  }
});

/**
 * GET /api/analytics/artists
 */
analyticsRouter.get('/artists', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const period = (req.query.period as 'all' | 'year' | 'month' | 'week') || 'all';
    const limit = parseInt(req.query.limit as string || '20', 10);
    const summary = await analyticsService.getAnalyticsSummary(req.user!.id, period);
    res.json({
      artists: summary.topArtists.slice(0, limit),
      totalArtists: summary.topArtists.length,
      loyalty: summary.loyalty,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch top artists' });
  }
});

/**
 * GET /api/analytics/tracks
 */
analyticsRouter.get('/tracks', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const period = (req.query.period as 'all' | 'year' | 'month' | 'week') || 'all';
    const limit = parseInt(req.query.limit as string || '20', 10);
    const summary = await analyticsService.getAnalyticsSummary(req.user!.id, period);
    res.json({
      tracks: summary.topTracks.slice(0, limit),
      totalTracks: summary.topTracks.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch top tracks' });
  }
});

/**
 * GET /api/analytics/discovery
 */
analyticsRouter.get('/discovery', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const period = (req.query.period as 'all' | 'year' | 'month' | 'week') || 'all';
    const summary = await analyticsService.getAnalyticsSummary(req.user!.id, period);
    res.json(summary.discovery);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch discovery patterns' });
  }
});

