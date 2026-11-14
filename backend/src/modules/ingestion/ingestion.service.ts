import prisma from '../../db/prisma.js';

export interface RawListeningRecord {
  trackTitle: string;
  artistName: string;
  albumTitle?: string;
  playedAt: string | Date;
  durationMs: number;
  msPlayed?: number;
  genres?: string[];
  coverUrl?: string;
  previewUrl?: string;
  source?: string;
  deviceType?: string;
  audioFeatures?: {
    danceability?: number;
    energy?: number;
    valence?: number;
    acousticness?: number;
    tempo?: number;
  };
}

export interface IngestionResult {
  totalProcessed: number;
  newEventsCreated: number;
  duplicatesSkipped: number;
  artistsUpserted: number;
  tracksUpserted: number;
}

export class IngestionService {
  /**
   * Ingests a batch of listening records into the provider-independent music data layer.
   * Keeps raw records separated from derived analytics.
   */
  public async ingestBatch(userId: string, records: RawListeningRecord[]): Promise<IngestionResult> {
    let newEventsCreated = 0;
    let duplicatesSkipped = 0;
    const touchedArtistIds = new Set<string>();
    const touchedTrackIds = new Set<string>();

    for (const record of records) {
      if (!record.trackTitle || !record.artistName) {
        continue;
      }

      const playedAt = new Date(record.playedAt);
      const durationMs = record.durationMs || 180000;
      const msPlayed = record.msPlayed ?? durationMs;
      const completionRate = Math.min(1.0, Math.max(0.0, msPlayed / durationMs));
      const source = record.source || 'import';

      // 1. Upsert Artist
      let artist = await prisma.artist.findFirst({
        where: { name: { equals: record.artistName, mode: 'insensitive' } },
      });

      if (!artist) {
        artist = await prisma.artist.create({
          data: {
            name: record.artistName,
            genres: record.genres || ['Electronic', 'Alternative'],
            imageUrl: record.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
            popularity: 80,
          },
        });
      } else if (record.genres && record.genres.length > 0) {
        const mergedGenres = Array.from(new Set([...artist.genres, ...record.genres]));
        artist = await prisma.artist.update({
          where: { id: artist.id },
          data: { genres: mergedGenres },
        });
      }
      touchedArtistIds.add(artist.id);

      // 2. Upsert Album if provided
      let albumId: string | null = null;
      if (record.albumTitle) {
        let album = await prisma.album.findFirst({
          where: {
            title: { equals: record.albumTitle, mode: 'insensitive' },
            artistId: artist.id,
          },
        });

        if (!album) {
          album = await prisma.album.create({
            data: {
              title: record.albumTitle,
              artistId: artist.id,
              coverUrl: record.coverUrl,
              genres: record.genres || [],
            },
          });
        }
        albumId = album.id;
      }

      // 3. Upsert Track
      let track = await prisma.track.findFirst({
        where: {
          title: { equals: record.trackTitle, mode: 'insensitive' },
          artistId: artist.id,
        },
      });

      if (!track) {
        track = await prisma.track.create({
          data: {
            title: record.trackTitle,
            artistId: artist.id,
            albumId: albumId,
            durationMs: durationMs,
            coverUrl: record.coverUrl,
            previewUrl: record.previewUrl,
            popularity: 75,
            danceability: record.audioFeatures?.danceability ?? 0.65,
            energy: record.audioFeatures?.energy ?? 0.70,
            valence: record.audioFeatures?.valence ?? 0.60,
            acousticness: record.audioFeatures?.acousticness ?? 0.20,
            tempo: record.audioFeatures?.tempo ?? 120,
          },
        });
      }
      touchedTrackIds.add(track.id);

      // 4. Ingest ListeningEvent with exact deduplication
      const existing = await prisma.listeningEvent.findFirst({
        where: {
          userId,
          trackId: track.id,
          playedAt: playedAt,
        },
      });

      if (existing) {
        duplicatesSkipped++;
      } else {
        await prisma.listeningEvent.create({
          data: {
            userId,
            trackId: track.id,
            playedAt: playedAt,
            durationMs: msPlayed,
            completionRate: completionRate,
            source: source,
            deviceType: record.deviceType || 'desktop',
          },
        });
        newEventsCreated++;
      }
    }

    return {
      totalProcessed: records.length,
      newEventsCreated,
      duplicatesSkipped,
      artistsUpserted: touchedArtistIds.size,
      tracksUpserted: touchedTrackIds.size,
    };
  }
}

export const ingestionService = new IngestionService();

