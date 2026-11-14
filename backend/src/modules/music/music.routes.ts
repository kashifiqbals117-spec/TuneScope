import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../../middleware/auth.js';
import prisma from '../../db/prisma.js';
import { ingestionService } from '../ingestion/ingestion.service.js';

export const musicRouter = Router();

/**
 * GET /api/music/history
 * Returns paginated listening history for authenticated user
 */
musicRouter.get('/history', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = Math.min(100, parseInt(req.query.limit as string || '25', 10));
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    const whereClause: any = {
      userId: req.user!.id,
    };

    if (search) {
      whereClause.track = {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { artist: { name: { contains: search, mode: 'insensitive' } } },
        ],
      };
    }

    const [events, total] = await Promise.all([
      prisma.listeningEvent.findMany({
        where: whereClause,
        include: {
          track: {
            include: {
              artist: true,
              album: true,
            },
          },
        },
        orderBy: { playedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.listeningEvent.count({ where: whereClause }),
    ]);

    res.json({
      events: events.map((e) => ({
        id: e.id,
        playedAt: e.playedAt.toISOString(),
        durationMs: e.durationMs,
        completionRate: e.completionRate,
        source: e.source,
        deviceType: e.deviceType,
        track: {
          id: e.track.id,
          title: e.track.title,
          durationMs: e.track.durationMs,
          previewUrl: e.track.previewUrl,
          coverUrl: e.track.coverUrl || e.track.album?.coverUrl,
          artistId: e.track.artistId,
          artistName: e.track.artist.name,
          albumTitle: e.track.album?.title,
          audioFeatures: {
            danceability: e.track.danceability,
            energy: e.track.energy,
            valence: e.track.valence,
          },
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch listening history' });
  }
});

/**
 * GET /api/music/artists
 */
musicRouter.get('/artists', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const search = req.query.search as string;
    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const artists = await prisma.artist.findMany({
      where,
      include: {
        _count: {
          select: { tracks: true },
        },
      },
      orderBy: { popularity: 'desc' },
      take: 50,
    });

    res.json(artists);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch artists' });
  }
});

/**
 * GET /api/music/artists/:id
 */
musicRouter.get('/artists/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const artistId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      include: {
        tracks: {
          take: 10,
          include: { album: true },
        },
        albums: true,
      },
    });

    if (!artist) {
      res.status(404).json({ error: 'Artist not found' });
      return;
    }

    res.json(artist);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch artist' });
  }
});

/**
 * GET /api/music/tracks
 */
musicRouter.get('/tracks', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const search = req.query.search as string;
    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { artist: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const tracks = await prisma.track.findMany({
      where,
      include: {
        artist: true,
        album: true,
      },
      orderBy: { popularity: 'desc' },
      take: 50,
    });

    res.json(tracks);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch tracks' });
  }
});

/**
 * POST /api/music/ingest
 * Ingests external listening records (JSON batch)
 */
musicRouter.post('/ingest', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      res.status(400).json({ error: 'Expected an array of listening records in "records".' });
      return;
    }

    const result = await ingestionService.ingestBatch(req.user!.id, records);
    res.json({
      success: true,
      result,
      message: `Ingested ${result.newEventsCreated} new listening events (${result.duplicatesSkipped} duplicates skipped).`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Ingestion failed' });
  }
});
