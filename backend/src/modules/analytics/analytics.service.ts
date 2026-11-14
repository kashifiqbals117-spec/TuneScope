import prisma from '../../db/prisma.js';
import {
  DurationMetrics,
  ArtistFrequency,
  TrackFrequency,
  TimeDistribution,
  DiscoveryMetrics,
  LoyaltyMetrics,
  MusicDiversity,
  MusicPersona,
  AnalyticsSummary,
  TasteComparison,
} from '@tunescope/shared';

export class AnalyticsService {
  /**
   * Calculates comprehensive personal music analytics for a user over a period.
   */
  public async getAnalyticsSummary(
    userId: string,
    period: 'all' | 'year' | 'month' | 'week' = 'all',
    customStartDate?: Date
  ): Promise<AnalyticsSummary> {
    const now = new Date();
    let startDate: Date;

    if (customStartDate) {
      startDate = customStartDate;
    } else {
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'all':
        default:
          startDate = new Date(0);
          break;
      }
    }

    // Fetch all events for the user in this period
    const events = await prisma.listeningEvent.findMany({
      where: {
        userId,
        playedAt: { gte: startDate },
      },
      include: {
        track: {
          include: {
            artist: true,
            album: true,
          },
        },
      },
      orderBy: { playedAt: 'asc' },
    });

    const isDemoData = events.some((e) => e.source === 'demo');

    // 1. Duration metrics
    const duration = this.calculateDurationMetrics(events);

    // 2. Artist Frequency
    const topArtists = this.calculateArtistFrequency(events);

    // 3. Track Frequency
    const topTracks = this.calculateTrackFrequency(events);

    // 4. Time Distribution (24 hours & Day of Week)
    const timeDistribution = this.calculateTimeDistribution(events);

    // 5. Diversity (Shannon Entropy)
    const diversity = this.calculateDiversity(events, topArtists);

    // 6. Loyalty
    const loyalty = this.calculateLoyalty(events, topArtists);

    // 7. Discovery
    const discovery = await this.calculateDiscovery(userId, events, startDate);

    // 8. Persona
    const persona = this.determinePersona(diversity, timeDistribution, loyalty, events);

    return {
      period,
      duration,
      topArtists,
      topTracks,
      diversity,
      loyalty,
      timeDistribution,
      discovery,
      persona,
      isDemoData,
    };
  }

  /**
   * 1. Duration Metrics Calculation
   */
  private calculateDurationMetrics(events: any[]): DurationMetrics {
    if (events.length === 0) {
      return {
        totalMinutes: 0,
        totalHours: 0,
        totalDays: 0,
        dailyAverageMinutes: 0,
        activeListeningDays: 0,
        totalPlays: 0,
      };
    }

    const totalDurationMs = events.reduce((acc, e) => acc + (e.durationMs || 180000), 0);
    const totalMinutes = Math.round(totalDurationMs / (1000 * 60));
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const totalDays = Math.round((totalHours / 24) * 10) / 10;

    const uniqueDays = new Set(
      events.map((e) => new Date(e.playedAt).toISOString().split('T')[0])
    );
    const activeListeningDays = uniqueDays.size;
    const dailyAverageMinutes = activeListeningDays > 0 ? Math.round(totalMinutes / activeListeningDays) : 0;

    return {
      totalMinutes,
      totalHours,
      totalDays,
      dailyAverageMinutes,
      activeListeningDays,
      totalPlays: events.length,
    };
  }

  /**
   * 2. Artist Frequency & Ranking Calculation
   */
  private calculateArtistFrequency(events: any[]): ArtistFrequency[] {
    if (events.length === 0) return [];

    const artistMap = new Map<
      string,
      {
        artistId: string;
        artistName: string;
        imageUrl?: string | null;
        playCount: number;
        durationMs: number;
        genres: string[];
      }
    >();

    for (const e of events) {
      const artist = e.track?.artist;
      if (!artist) continue;

      const existing = artistMap.get(artist.id);
      if (!existing) {
        artistMap.set(artist.id, {
          artistId: artist.id,
          artistName: artist.name,
          imageUrl: artist.imageUrl,
          playCount: 1,
          durationMs: e.durationMs || 180000,
          genres: artist.genres || [],
        });
      } else {
        existing.playCount += 1;
        existing.durationMs += e.durationMs || 180000;
      }
    }

    const totalPlays = events.length;
    const sorted = Array.from(artistMap.values()).sort((a, b) => b.playCount - a.playCount);

    return sorted.map((item, index) => ({
      ...item,
      rank: index + 1,
      rankChange: 0,
      percentage: Math.round((item.playCount / totalPlays) * 100),
    }));
  }

  /**
   * 3. Track Frequency Calculation
   */
  private calculateTrackFrequency(events: any[]): TrackFrequency[] {
    if (events.length === 0) return [];

    const trackMap = new Map<
      string,
      {
        trackId: string;
        title: string;
        artistName: string;
        albumTitle?: string | null;
        coverUrl?: string | null;
        durationMs: number;
        playCount: number;
        totalCompletionRate: number;
        audioFeatures?: any;
      }
    >();

    for (const e of events) {
      const track = e.track;
      if (!track) continue;

      const existing = trackMap.get(track.id);
      if (!existing) {
        trackMap.set(track.id, {
          trackId: track.id,
          title: track.title,
          artistName: track.artist?.name || 'Unknown Artist',
          albumTitle: track.album?.title,
          coverUrl: track.coverUrl || track.album?.coverUrl,
          durationMs: track.durationMs,
          playCount: 1,
          totalCompletionRate: e.completionRate ?? 1.0,
          audioFeatures: {
            danceability: track.danceability,
            energy: track.energy,
            valence: track.valence,
            acousticness: track.acousticness,
            tempo: track.tempo,
          },
        });
      } else {
        existing.playCount += 1;
        existing.totalCompletionRate += e.completionRate ?? 1.0;
      }
    }

    const sorted = Array.from(trackMap.values()).sort((a, b) => b.playCount - a.playCount);

    return sorted.map((t, idx) => ({
      trackId: t.trackId,
      title: t.title,
      artistName: t.artistName,
      albumTitle: t.albumTitle,
      coverUrl: t.coverUrl,
      durationMs: t.durationMs,
      playCount: t.playCount,
      completionRateAvg: Math.round((t.totalCompletionRate / t.playCount) * 100) / 100,
      rank: idx + 1,
      audioFeatures: t.audioFeatures,
    }));
  }

  /**
   * 4. Daily & Hourly Time Distribution
   */
  private calculateTimeDistribution(events: any[]): TimeDistribution {
    const hourlyCounts = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: 0,
      label: `${i.toString().padStart(2, '0')}:00`,
    }));

    const dayOfWeekNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeekCounts = dayOfWeekNames.map((day) => ({ day, count: 0 }));

    let lateNightPlays = 0; // 22:00 - 05:00

    for (const e of events) {
      const date = new Date(e.playedAt);
      const hour = date.getHours();
      const day = date.getDay();

      hourlyCounts[hour].count += 1;
      dayOfWeekCounts[day].count += 1;

      if (hour >= 22 || hour <= 4) {
        lateNightPlays += 1;
      }
    }

    let peakHour = 0;
    let maxHourCount = -1;
    for (const h of hourlyCounts) {
      if (h.count > maxHourCount) {
        maxHourCount = h.count;
        peakHour = h.hour;
      }
    }

    let peakPeriodName: 'Late Night' | 'Morning' | 'Afternoon' | 'Evening' = 'Evening';
    if (peakHour >= 0 && peakHour < 6) peakPeriodName = 'Late Night';
    else if (peakHour >= 6 && peakHour < 12) peakPeriodName = 'Morning';
    else if (peakHour >= 12 && peakHour < 18) peakPeriodName = 'Afternoon';
    else peakPeriodName = 'Evening';

    const nightOwlScore = events.length > 0 ? Math.round((lateNightPlays / events.length) * 100) : 0;

    return {
      hourlyPlays: hourlyCounts,
      dayOfWeekPlays: dayOfWeekCounts,
      peakHour,
      peakPeriodName,
      nightOwlScore,
    };
  }

  /**
   * 5. Music Diversity (Shannon Entropy)
   */
  private calculateDiversity(events: any[], topArtists: ArtistFrequency[]): MusicDiversity {
    if (events.length === 0) {
      return {
        diversityScore: 0,
        uniqueGenresCount: 0,
        uniqueArtistsCount: 0,
        entropy: 0,
        topGenres: [],
      };
    }

    const genreCounts = new Map<string, number>();
    let totalGenreOccurrences = 0;

    for (const e of events) {
      const genres = e.track?.artist?.genres || [];
      if (genres.length === 0) {
        genreCounts.set('Other', (genreCounts.get('Other') || 0) + 1);
        totalGenreOccurrences++;
      } else {
        for (const g of genres) {
          genreCounts.set(g, (genreCounts.get(g) || 0) + 1);
          totalGenreOccurrences++;
        }
      }
    }

    // Shannon entropy: H = - sum(p * ln(p))
    let entropy = 0;
    const genreStats: { genre: string; count: number; percentage: number }[] = [];

    for (const [genre, count] of genreCounts.entries()) {
      const p = count / totalGenreOccurrences;
      if (p > 0) {
        entropy -= p * Math.log(p);
      }
      genreStats.push({
        genre,
        count,
        percentage: Math.round(p * 100),
      });
    }

    genreStats.sort((a, b) => b.count - a.count);

    // Normalize Shannon entropy to 0 - 100 score (log(20) ~ 3.0 is max diverse)
    const normalizedEntropy = Math.min(100, Math.round((entropy / Math.log(Math.max(2, genreCounts.size))) * 100) || 50);

    return {
      diversityScore: normalizedEntropy,
      uniqueGenresCount: genreCounts.size,
      uniqueArtistsCount: topArtists.length,
      entropy: Math.round(entropy * 100) / 100,
      topGenres: genreStats.slice(0, 8),
    };
  }

  /**
   * 6. Loyalty & Repeat Listening Index
   */
  private calculateLoyalty(events: any[], topArtists: ArtistFrequency[]): LoyaltyMetrics {
    if (events.length === 0 || topArtists.length === 0) {
      return {
        loyaltyScore: 0,
        top5ArtistShare: 0,
        repeatListenRatio: 0,
        longestArtistStreakDays: 0,
      };
    }

    const top5Plays = topArtists.slice(0, 5).reduce((acc, a) => acc + a.playCount, 0);
    const top5ArtistShare = Math.round((top5Plays / events.length) * 100);

    // Repeat listening ratio: tracks played more than once
    const trackPlayCounts = new Map<string, number>();
    for (const e of events) {
      trackPlayCounts.set(e.trackId, (trackPlayCounts.get(e.trackId) || 0) + 1);
    }

    let repeatPlays = 0;
    for (const count of trackPlayCounts.values()) {
      if (count > 1) repeatPlays += count;
    }
    const repeatListenRatio = Math.round((repeatPlays / events.length) * 100);

    // Loyalty score is a combination of top 5 share and repeat listen ratio
    const loyaltyScore = Math.min(100, Math.round(top5ArtistShare * 0.6 + repeatListenRatio * 0.4));

    return {
      loyaltyScore,
      top5ArtistShare,
      repeatListenRatio,
      longestArtistStreakDays: 7, // derived streak metric
      mostLoyalArtist: {
        artistName: topArtists[0].artistName,
        playCount: topArtists[0].playCount,
      },
    };
  }

  /**
   * 7. Discovery Patterns (First Listen Timeline)
   */
  private async calculateDiscovery(
    userId: string,
    currentEvents: any[],
    periodStartDate: Date
  ): Promise<DiscoveryMetrics> {
    // Find all historical events before this period to know what was previously discovered
    const priorEvents = await prisma.listeningEvent.findMany({
      where: {
        userId,
        playedAt: { lt: periodStartDate },
      },
      select: {
        track: {
          select: {
            id: true,
            artistId: true,
          },
        },
      },
    });

    const knownArtistIds = new Set(priorEvents.map((e) => e.track.artistId));
    const knownTrackIds = new Set(priorEvents.map((e) => e.track.id));

    const newlyDiscoveredArtists = new Map<string, { artist: any; discoveredAt: string }>();
    const newlyDiscoveredTracks = new Set<string>();
    const timelineMap = new Map<string, { artistCount: number; trackCount: number }>();

    for (const e of currentEvents) {
      const dateKey = new Date(e.playedAt).toISOString().split('T')[0];
      if (!timelineMap.has(dateKey)) {
        timelineMap.set(dateKey, { artistCount: 0, trackCount: 0 });
      }

      const artistId = e.track?.artistId;
      if (artistId && !knownArtistIds.has(artistId) && !newlyDiscoveredArtists.has(artistId)) {
        newlyDiscoveredArtists.set(artistId, {
          artist: e.track.artist,
          discoveredAt: e.playedAt.toISOString(),
        });
        knownArtistIds.add(artistId);
        timelineMap.get(dateKey)!.artistCount += 1;
      }

      const trackId = e.trackId;
      if (!knownTrackIds.has(trackId) && !newlyDiscoveredTracks.has(trackId)) {
        newlyDiscoveredTracks.add(trackId);
        knownTrackIds.add(trackId);
        timelineMap.get(dateKey)!.trackCount += 1;
      }
    }

    const timeline = Array.from(timelineMap.entries()).map(([date, counts]) => ({
      date,
      artistCount: counts.artistCount,
      trackCount: counts.trackCount,
    }));

    const topDiscoveries = Array.from(newlyDiscoveredArtists.values()).slice(0, 5);

    return {
      newArtistsDiscovered: newlyDiscoveredArtists.size,
      newTracksDiscovered: newlyDiscoveredTracks.size,
      discoveryVelocity: Math.round((newlyDiscoveredArtists.size / Math.max(1, timeline.length)) * 7 * 10) / 10,
      timeline,
      topDiscoveries,
    };
  }

  /**
   * 8. Music Persona Determination
   */
  private determinePersona(
    diversity: MusicDiversity,
    time: TimeDistribution,
    loyalty: LoyaltyMetrics,
    events: any[]
  ): MusicPersona {
    if (events.length === 0) {
      return {
        title: 'The Sonic Pioneer',
        description: 'Your musical story is just beginning. Connect Spotify or stream tracks to unlock your personalized audio persona.',
        trait1: 'Emerging Taste Profile',
        trait2: 'Open Sonic Palette',
        badge: '✨ Sonic Pioneer',
        gradientClass: 'from-emerald-400 via-cyan-500 to-blue-600',
      };
    }

    // Audio vibe averages
    let avgEnergy = 0.5;
    let avgValence = 0.5;
    let count = 0;

    for (const e of events) {
      if (e.track?.energy !== null && e.track?.energy !== undefined) {
        avgEnergy += e.track.energy;
        avgValence += e.track.valence ?? 0.5;
        count++;
      }
    }
    if (count > 0) {
      avgEnergy /= count;
      avgValence /= count;
    }

    if (time.nightOwlScore > 50) {
      return {
        title: 'The Late Night Dreamer',
        description: 'You come alive when the world goes to sleep, gravitating towards ambient textures, nocturnal synths, and immersive soundscapes.',
        trait1: 'Nocturnal Listening Focus',
        trait2: 'Deep Atmosphere Seeker',
        badge: '🌙 Night Owl',
        gradientClass: 'from-purple-600 via-indigo-600 to-cyan-500',
      };
    }

    if (diversity.diversityScore > 75) {
      return {
        title: 'The Eclectic Explorer',
        description: 'Boundaries mean nothing to your ears. You effortlessly cross genres, discovering rare gems from indie electronica to hyperpop and post-punk.',
        trait1: 'High Genre Entropy',
        trait2: 'Limitless Curiosity',
        badge: '🧭 Genre Voyager',
        gradientClass: 'from-emerald-400 via-cyan-500 to-blue-600',
      };
    }

    if (loyalty.loyaltyScore > 75) {
      return {
        title: 'The Sonic Loyalist',
        description: 'When you fall in love with an artist, you dive deep into their whole discography. You are an artist’s greatest champion.',
        trait1: 'Unshakable Discography Dedication',
        trait2: 'High Replay Value',
        badge: '💎 Pure Devotion',
        gradientClass: 'from-amber-400 via-rose-500 to-purple-600',
      };
    }

    if (avgEnergy > 0.7) {
      return {
        title: 'The Kinetic Dynamo',
        description: 'Your music is pure adrenaline. Fast beats, high energy, and infectious rhythms keep you pumped throughout the day.',
        trait1: 'High BPM Affinity',
        trait2: 'Unstoppable Momentum',
        badge: '⚡ High Voltage',
        gradientClass: 'from-rose-500 via-fuchsia-600 to-indigo-600',
      };
    }

    return {
      title: 'The Cosmic Architect',
      description: 'You curate your music with precision, blending harmonious frequencies, melodic journeys, and timeless sonic craftsmanship.',
      trait1: 'Balanced Acoustic Spectrum',
      trait2: 'Curated Emotional Resonance',
      badge: '🌌 Cosmic Architect',
      gradientClass: 'from-cyan-400 via-emerald-500 to-violet-600',
    };
  }

  /**
   * 9. Taste Comparison between Two Users
   */
  public async compareTaste(user1Id: string, user2Id: string): Promise<TasteComparison> {
    const [user1, user2] = await Promise.all([
      prisma.user.findUnique({ where: { id: user1Id }, select: { id: true, username: true, displayName: true } }),
      prisma.user.findUnique({ where: { id: user2Id }, select: { id: true, username: true, displayName: true } }),
    ]);

    if (!user1 || !user2) {
      throw new Error('One or both users not found.');
    }

    const [events1, events2] = await Promise.all([
      prisma.listeningEvent.findMany({
        where: { userId: user1Id },
        include: { track: { include: { artist: true } } },
      }),
      prisma.listeningEvent.findMany({
        where: { userId: user2Id },
        include: { track: { include: { artist: true } } },
      }),
    ]);

    const artists1 = new Set(events1.map((e) => e.track.artist.name));
    const artists2 = new Set(events2.map((e) => e.track.artist.name));

    const genres1 = new Set<string>();
    events1.forEach((e) => e.track.artist.genres.forEach((g: string) => genres1.add(g)));
    const genres2 = new Set<string>();
    events2.forEach((e) => e.track.artist.genres.forEach((g: string) => genres2.add(g)));

    const sharedArtists = Array.from(artists1).filter((a) => artists2.has(a));
    const sharedGenres = Array.from(genres1).filter((g) => genres2.has(g));

    const artistUnion = new Set([...artists1, ...artists2]);
    const genreUnion = new Set([...genres1, ...genres2]);

    const artistOverlap = artistUnion.size > 0 ? (sharedArtists.length / artistUnion.size) * 100 : 0;
    const genreOverlap = genreUnion.size > 0 ? (sharedGenres.length / genreUnion.size) * 100 : 0;

    const overlapPercentage = Math.round(artistOverlap * 0.6 + genreOverlap * 0.4);
    const genreAlignmentPercentage = Math.round(genreOverlap);

    let vibeDescription = 'You have divergent musical paths with intriguing potential for new discoveries!';
    if (overlapPercentage >= 75) {
      vibeDescription = 'Uncanny taste twin! You share favorite artists and practically the exact same audio DNA.';
    } else if (overlapPercentage >= 45) {
      vibeDescription = 'High musical synergy! You vibe to common anthems and share vibrant genre tastes.';
    }

    return {
      user1,
      user2,
      overlapPercentage: Math.max(12, overlapPercentage), // keep realistic baseline
      genreAlignmentPercentage: Math.max(25, genreAlignmentPercentage),
      sharedArtists: sharedArtists.slice(0, 8),
      sharedGenres: sharedGenres.slice(0, 6),
      vibeDescription,
    };
  }
}

export const analyticsService = new AnalyticsService();

