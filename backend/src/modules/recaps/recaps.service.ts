import crypto from 'crypto';
import prisma from '../../db/prisma.js';
import { analyticsService } from '../analytics/analytics.service.js';
import { RecapType, RecapSlide } from '@tunescope/shared';

export class RecapsService {
  /**
   * Generates or fetches a Weekly or Yearly Recap for a user
   */
  public async generateRecap(
    userId: string,
    type: RecapType = RecapType.YEARLY,
    year = 2026,
    weekNumber?: number
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true, username: true, avatarUrl: true },
    });

    if (!user) throw new Error('User not found');

    const period = type === RecapType.WEEKLY ? 'week' : 'year';
    const summary = await analyticsService.getAnalyticsSummary(userId, period);

    // Build interactive slide deck
    const slides: RecapSlide[] = [
      {
        id: 'slide-1',
        type: 'intro',
        title: type === RecapType.WEEKLY ? `Week ${weekNumber || 45} Recap` : `${year} Wrapped Experience`,
        subtitle: `Your sonic journey, curated exclusively for ${user.displayName}.`,
        data: {
          userName: user.displayName,
          avatarUrl: user.avatarUrl,
          totalPlays: summary.duration.totalPlays,
          isDemoData: summary.isDemoData,
        },
        accentColor: '#10B981',
      },
      {
        id: 'slide-2',
        type: 'minutes',
        title: 'Your Time in Sound',
        subtitle: `You spent ${summary.duration.totalMinutes.toLocaleString()} minutes immersed in music.`,
        data: {
          totalMinutes: summary.duration.totalMinutes,
          totalHours: summary.duration.totalHours,
          dailyAverageMinutes: summary.duration.dailyAverageMinutes,
          activeListeningDays: summary.duration.activeListeningDays,
        },
        accentColor: '#8B5CF6',
      },
      {
        id: 'slide-3',
        type: 'top_artist',
        title: 'Your #1 Artist',
        subtitle: summary.topArtists[0]?.artistName || 'Undiscovered',
        data: {
          artist: summary.topArtists[0] || null,
          mostLoyalArtist: summary.loyalty.mostLoyalArtist,
          top5Share: summary.loyalty.top5ArtistShare,
        },
        accentColor: '#06B6D4',
      },
      {
        id: 'slide-4',
        type: 'top_tracks',
        title: 'Top 5 Anthems',
        subtitle: 'The tracks that defined your soundtrack.',
        data: {
          tracks: summary.topTracks.slice(0, 5),
        },
        accentColor: '#F59E0B',
      },
      {
        id: 'slide-5',
        type: 'genres',
        title: 'Sonic Spectrum',
        subtitle: `Diversity score: ${summary.diversity.diversityScore}/100 across ${summary.diversity.uniqueGenresCount} genres.`,
        data: {
          diversity: summary.diversity,
          topGenres: summary.diversity.topGenres,
        },
        accentColor: '#EC4899',
      },
      {
        id: 'slide-6',
        type: 'discovery',
        title: 'New Horizons',
        subtitle: `You discovered ${summary.discovery.newArtistsDiscovered} brand new artists.`,
        data: {
          discovery: summary.discovery,
        },
        accentColor: '#3B82F6',
      },
      {
        id: 'slide-7',
        type: 'persona',
        title: 'Your Music Persona',
        subtitle: summary.persona.title,
        data: {
          persona: summary.persona,
        },
        accentColor: '#10B981',
      },
      {
        id: 'slide-8',
        type: 'summary',
        title: 'Your Recap Snapshot',
        subtitle: 'Share your music story with your friends.',
        data: {
          user,
          summary,
        },
        accentColor: '#6366F1',
      },
    ];

    const shareToken = crypto.randomBytes(12).toString('hex');
    const title = type === RecapType.WEEKLY ? `Weekly Soundscape · Week ${weekNumber || 45}` : `${year} Wrapped Story`;

    const recap = await prisma.recap.create({
      data: {
        userId,
        type,
        year,
        weekNumber: weekNumber ?? null,
        title,
        summaryData: summary as any,
        slides: slides as any,
        isShareable: true,
        shareToken,
      },
    });

    return recap;
  }

  /**
   * Fetches user's recaps
   */
  public async getUserRecaps(userId: string) {
    return prisma.recap.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Gets recap by ID
   */
  public async getRecapById(recapId: string) {
    return prisma.recap.findUnique({
      where: { id: recapId },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });
  }

  /**
   * Gets public recap by share token
   */
  public async getRecapByShareToken(shareToken: string) {
    return prisma.recap.findUnique({
      where: { shareToken },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });
  }
}

export const recapsService = new RecapsService();

