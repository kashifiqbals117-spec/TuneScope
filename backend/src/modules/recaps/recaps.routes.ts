import { Router, Request, Response } from 'express';
import { requireAuth, optionalAuth, AuthRequest } from '../../middleware/auth.js';
import { recapsService } from './recaps.service.js';
import { RecapType } from '@tunescope/shared';

export const recapsRouter = Router();

/**
 * GET /api/recaps
 */
recapsRouter.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const recaps = await recapsService.getUserRecaps(req.user!.id);
    res.json(recaps);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch recaps' });
  }
});

/**
 * POST /api/recaps/generate
 */
recapsRouter.post('/generate', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const type = req.body.type === 'WEEKLY' ? RecapType.WEEKLY : RecapType.YEARLY;
    const year = parseInt(req.body.year || '2026', 10);
    const weekNumber = req.body.weekNumber ? parseInt(req.body.weekNumber, 10) : undefined;

    const recap = await recapsService.generateRecap(req.user!.id, type, year, weekNumber);
    res.status(201).json(recap);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate recap' });
  }
});

/**
 * GET /api/recaps/share/:shareToken (Public)
 */
recapsRouter.get('/share/:shareToken', async (req: Request, res: Response) => {
  try {
    const shareToken = Array.isArray(req.params.shareToken) ? req.params.shareToken[0] : req.params.shareToken;
    const recap = await recapsService.getRecapByShareToken(shareToken);

    if (!recap) {
      res.status(404).json({ error: 'Recap not found or sharing has been disabled.' });
      return;
    }

    res.json(recap);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to load shared recap' });
  }
});

/**
 * GET /api/recaps/:id
 */
recapsRouter.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const recapId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const recap = await recapsService.getRecapById(recapId);
    if (!recap) {
      res.status(404).json({ error: 'Recap not found' });
      return;
    }

    // If private and not owner, restrict
    if (!recap.isShareable && (!req.user || req.user.id !== recap.userId)) {
      res.status(403).json({ error: 'This recap is private.' });
      return;
    }

    res.json(recap);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to load recap' });
  }
});
