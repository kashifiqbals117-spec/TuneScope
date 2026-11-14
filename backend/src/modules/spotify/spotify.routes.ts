import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../../middleware/auth.js';
import { spotifyProvider } from './spotify.provider.js';
import { env } from '../../config/env.js';
import prisma from '../../db/prisma.js';

export const spotifyRouter = Router();

/**
 * GET /api/spotify/auth-url
 * Returns authorization URL for official Spotify OAuth
 */
spotifyRouter.get('/auth-url', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    if (!env.SPOTIFY_CLIENT_ID) {
      res.status(503).json({
        error: 'Spotify integration is not configured. Missing SPOTIFY_CLIENT_ID in environment.',
      });
      return;
    }

    const returnTo = (req.query.returnTo as string) || '/profile';
    const state = JSON.stringify({ userId: req.user!.id, timestamp: Date.now(), returnTo });
    const encodedState = Buffer.from(state).toString('base64url');
    const url = spotifyProvider.getAuthorizationUrl(encodedState);

    res.json({ url });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate Spotify authorization URL' });
  }
});

/**
 * GET /api/spotify/callback
 * Handles Spotify OAuth redirect
 */
spotifyRouter.get('/callback', async (req, res) => {
  const code = req.query.code as string;
  const state = req.query.state as string;
  const error = req.query.error as string;

  let returnPath = '/profile';
  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf-8'));
      if (decoded.returnTo && typeof decoded.returnTo === 'string' && decoded.returnTo.startsWith('/')) {
        returnPath = decoded.returnTo;
      }
    } catch {
      // Handled in main try/catch block
    }
  }

  if (error) {
    const redirectUrl = `${env.FRONTEND_URL}${returnPath}?spotify=error&message=${encodeURIComponent(error)}`;
    res.redirect(redirectUrl);
    return;
  }

  if (!code || !state) {
    const redirectUrl = `${env.FRONTEND_URL}${returnPath}?spotify=error&message=${encodeURIComponent('Missing authorization code or state')}`;
    res.redirect(redirectUrl);
    return;
  }

  try {
    let userId: string;
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf-8'));
      userId = decoded.userId;
    } catch {
      throw new Error('Invalid state parameter in OAuth callback');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found for OAuth session');
    }

    // 1. Exchange authorization code for tokens
    const tokens = await spotifyProvider.exchangeCodeForTokens(code);
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

    // 2. Persist tokens in PostgreSQL
    const connection = await prisma.providerConnection.upsert({
      where: {
        userId_provider: {
          userId,
          provider: 'spotify',
        },
      },
      create: {
        userId,
        provider: 'spotify',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: expiresAt,
        scope: tokens.scope,
        isConnected: false, // will mark true only upon successful API verification
      },
      update: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || undefined,
        tokenExpiresAt: expiresAt,
        scope: tokens.scope,
      },
    });

    // 3. Immediately verify against official Spotify API
    try {
      const profile = await spotifyProvider.getUserProfile(tokens.accessToken);

      await prisma.providerConnection.update({
        where: { id: connection.id },
        data: {
          isConnected: true,
          providerUserId: profile.id,
          lastSyncedAt: new Date(),
        },
      });

      res.redirect(`${env.FRONTEND_URL}${returnPath}?spotify=connected`);
    } catch (apiErr: any) {
      const apiStatus = apiErr.status || 500;
      let userFriendlyMessage = apiErr.message || 'Spotify verification failed';

      if (apiStatus === 403) {
        if (userFriendlyMessage.includes('Active premium subscription required') || userFriendlyMessage.includes('premium')) {
          userFriendlyMessage =
            'Spotify Developer Restriction: An active Spotify Premium subscription is required for Developer Web API access.';
        } else if (userFriendlyMessage.includes('User not registered') || userFriendlyMessage.includes('not registered')) {
          userFriendlyMessage =
            'Spotify Development Mode: Your Spotify account must be added under User Management in the Spotify Developer Dashboard.';
        } else {
          userFriendlyMessage =
            'Spotify API Access Restricted (HTTP 403): Ensure your Spotify account is registered in User Management on the Developer Dashboard and meets Spotify Developer Policy requirements.';
        }
      }

      await prisma.providerConnection.update({
        where: { id: connection.id },
        data: { isConnected: false },
      });

      res.redirect(
        `${env.FRONTEND_URL}${returnPath}?spotify=restricted&message=${encodeURIComponent(userFriendlyMessage)}`
      );
    }
  } catch (err: any) {
    console.error('Spotify OAuth callback failed:', err.message);
    res.redirect(
      `${env.FRONTEND_URL}${returnPath}?spotify=error&message=${encodeURIComponent(err.message || 'OAuth failure')}`
    );
  }
});

/**
 * GET /api/spotify/status
 * Returns verified connection status and permission details for authenticated user
 */
spotifyRouter.get('/status', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const connection = await prisma.providerConnection.findUnique({
      where: {
        userId_provider: {
          userId: req.user!.id,
          provider: 'spotify',
        },
      },
    });

    if (!connection || !connection.accessToken) {
      res.json({
        isConnected: false,
        verified: false,
        hasStoredCredentials: false,
        hasClientCredentials: Boolean(env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET),
        provider: 'spotify',
      });
      return;
    }

    // Verify live against Spotify Web API
    const verification = await spotifyProvider.verifyConnection(req.user!.id);

    res.json({
      isConnected: verification.verified,
      verified: verification.verified,
      hasStoredCredentials: true,
      hasClientCredentials: Boolean(env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET),
      provider: 'spotify',
      providerUserId: connection.providerUserId || verification.profile?.id || null,
      spotifyUser: verification.profile || null,
      scope: connection.scope,
      lastSyncedAt: connection.lastSyncedAt,
      tokenExpiresAt: connection.tokenExpiresAt,
      apiStatus: verification.status,
      error: verification.error || null,
      details: verification.details || null,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to check Spotify status' });
  }
});

/**
 * POST /api/spotify/verify
 * Explicit on-demand verification endpoint
 */
spotifyRouter.post('/verify', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await spotifyProvider.verifyConnection(req.user!.id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Verification check failed' });
  }
});

/**
 * GET /api/spotify/profile
 * Retrieves verified Spotify profile from /v1/me
 */
spotifyRouter.get('/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const token = await spotifyProvider.getValidAccessToken(req.user!.id, true);
    if (!token) {
      res.status(401).json({ error: 'No valid Spotify credentials found. Please connect Spotify.' });
      return;
    }

    const profile = await spotifyProvider.getUserProfile(token);
    res.json(profile);
  } catch (error: any) {
    res.status(error.status || 500).json({
      error: error.message || 'Failed to fetch Spotify profile',
      status: error.status,
    });
  }
});

/**
 * POST /api/spotify/disconnect
 * Disconnects Spotify account and revokes local tokens
 */
spotifyRouter.post('/disconnect', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await spotifyProvider.disconnect(req.user!.id);
    res.json({ success: true, message: 'Spotify disconnected successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to disconnect Spotify' });
  }
});

/**
 * POST /api/spotify/sync
 * Syncs recently played tracks from permitted official Spotify Web API endpoint
 */
spotifyRouter.post('/sync', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const token = await spotifyProvider.getValidAccessToken(req.user!.id, true);
    if (!token) {
      res.status(401).json({
        error: 'Spotify connection expired or revoked. Please reconnect your Spotify account.',
      });
      return;
    }

    let recentTracks;
    try {
      recentTracks = await spotifyProvider.getRecentlyPlayed(token, 50);
    } catch (apiErr: any) {
      res.status(apiErr.status || 500).json({
        error: apiErr.message || 'Spotify API error while fetching recently played tracks.',
        status: apiErr.status,
        details:
          apiErr.status === 403 && apiErr.message?.includes('Active premium subscription required')
            ? 'Active Spotify Premium subscription required for the developer account owning this app (Spotify Developer Policy).'
            : undefined,
      });
      return;
    }

    let ingestedCount = 0;

    for (const item of recentTracks) {
      const spTrack = item.track;
      const playedAt = new Date(item.played_at);

      // Upsert Artist
      const primaryArtist = spTrack.artists[0];
      const artist = await prisma.artist.upsert({
        where: { providerId: primaryArtist.id },
        create: {
          providerId: primaryArtist.id,
          name: primaryArtist.name,
          genres: [],
        },
        update: {
          name: primaryArtist.name,
        },
      });

      // Upsert Album
      let album = null;
      if (spTrack.album) {
        album = await prisma.album.upsert({
          where: { providerId: spTrack.album.id },
          create: {
            providerId: spTrack.album.id,
            title: spTrack.album.name,
            artistId: artist.id,
            releaseDate: spTrack.album.release_date,
            totalTracks: spTrack.album.total_tracks,
            coverUrl: spTrack.album.images?.[0]?.url,
            genres: [],
          },
          update: {
            coverUrl: spTrack.album.images?.[0]?.url,
          },
        });
      }

      // Upsert Track
      const track = await prisma.track.upsert({
        where: { providerId: spTrack.id },
        create: {
          providerId: spTrack.id,
          title: spTrack.name,
          artistId: artist.id,
          albumId: album?.id,
          durationMs: spTrack.duration_ms,
          explicit: spTrack.explicit,
          previewUrl: spTrack.preview_url,
          coverUrl: spTrack.album?.images?.[0]?.url,
          popularity: spTrack.popularity,
        },
        update: {
          previewUrl: spTrack.preview_url,
          coverUrl: spTrack.album?.images?.[0]?.url,
        },
      });

      // Avoid duplicate listening events
      const existing = await prisma.listeningEvent.findFirst({
        where: {
          userId: req.user!.id,
          trackId: track.id,
          playedAt: playedAt,
        },
      });

      if (!existing) {
        await prisma.listeningEvent.create({
          data: {
            userId: req.user!.id,
            trackId: track.id,
            playedAt: playedAt,
            durationMs: spTrack.duration_ms,
            completionRate: 1.0,
            source: 'spotify',
          },
        });
        ingestedCount++;
      }
    }

    // Update lastSyncedAt
    await prisma.providerConnection.update({
      where: {
        userId_provider: {
          userId: req.user!.id,
          provider: 'spotify',
        },
      },
      data: {
        lastSyncedAt: new Date(),
        isConnected: true,
      },
    });

    res.json({
      success: true,
      ingestedCount,
      totalFetched: recentTracks.length,
      message:
        recentTracks.length === 0
          ? 'Connected to Spotify, but no recently played tracks were returned for this account.'
          : `Successfully synced ${ingestedCount} new tracks from Spotify (${recentTracks.length} total fetched).`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to sync with Spotify' });
  }
});

/**
 * GET /api/spotify/now-playing
 * Returns currently playing track if Spotify is connected and active
 */
spotifyRouter.get('/now-playing', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const token = await spotifyProvider.getValidAccessToken(req.user!.id, false);
    if (!token) {
      res.json({ isPlaying: false, track: null });
      return;
    }

    const nowPlaying = await spotifyProvider.getCurrentlyPlaying(token);
    res.json(nowPlaying || { isPlaying: false, track: null });
  } catch {
    res.json({ isPlaying: false, track: null });
  }
});
