// Shared Types and Models for TuneScope

export enum PrivacySetting {
  PUBLIC = 'PUBLIC',
  FRIENDS_ONLY = 'FRIENDS_ONLY',
  PRIVATE = 'PRIVATE'
}

export enum ReactionType {
  FIRE = 'FIRE',
  LOVE = 'LOVE',
  REPEAT = 'REPEAT',
  VIBE = 'VIBE',
  MIND_BLOWN = 'MIND_BLOWN'
}

export enum FriendshipStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export enum RecapType {
  WEEKLY = 'WEEKLY',
  YEARLY = 'YEARLY'
}

export enum EventSource {
  SPOTIFY = 'spotify',
  DEMO = 'demo',
  IMPORT = 'import',
  MANUAL = 'manual'
}

// User Profile
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  persona?: string | null;
  privacySetting: PrivacySetting;
  createdAt: string;
  updatedAt: string;
}

// Music Data Layer Entities (Provider Independent)
export interface AudioFeatures {
  danceability?: number;
  energy?: number;
  valence?: number;
  acousticness?: number;
  tempo?: number;
}

export interface Artist {
  id: string;
  providerId?: string | null;
  name: string;
  genres: string[];
  imageUrl?: string | null;
  popularity?: number | null;
  followers?: number | null;
  externalUrl?: string | null;
}

export interface Album {
  id: string;
  providerId?: string | null;
  title: string;
  artistId: string;
  artistName?: string;
  releaseDate?: string | null;
  totalTracks?: number | null;
  coverUrl?: string | null;
  genres: string[];
}

export interface Track {
  id: string;
  providerId?: string | null;
  title: string;
  artistId: string;
  artistName: string;
  albumId?: string | null;
  albumTitle?: string | null;
  durationMs: number;
  explicit: boolean;
  previewUrl?: string | null;
  coverUrl?: string | null;
  popularity?: number | null;
  audioFeatures?: AudioFeatures | null;
}

export interface ListeningEvent {
  id: string;
  userId: string;
  trackId: string;
  track?: Track;
  playedAt: string;
  durationMs: number;
  completionRate: number; // 0.0 to 1.0
  source: EventSource;
  deviceType?: string | null;
}

// Provider Connection
export interface ProviderConnection {
  id: string;
  userId: string;
  provider: string; // 'spotify'
  providerUserId?: string | null;
  isConnected: boolean;
  scope?: string | null;
  lastSyncedAt?: string | null;
  tokenExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Analytics Models
export interface DurationMetrics {
  totalMinutes: number;
  totalHours: number;
  totalDays: number;
  dailyAverageMinutes: number;
  activeListeningDays: number;
  totalPlays: number;
}

export interface ArtistFrequency {
  artistId: string;
  artistName: string;
  imageUrl?: string | null;
  playCount: number;
  durationMs: number;
  genres: string[];
  rank: number;
  rankChange?: number; // compared to previous period
  percentage: number;
}

export interface TrackFrequency {
  trackId: string;
  title: string;
  artistName: string;
  albumTitle?: string | null;
  coverUrl?: string | null;
  durationMs: number;
  playCount: number;
  completionRateAvg: number;
  rank: number;
  audioFeatures?: AudioFeatures | null;
}

export interface GenreStat {
  genre: string;
  count: number;
  percentage: number;
}

export interface TimeDistribution {
  hourlyPlays: { hour: number; count: number; label: string }[];
  dayOfWeekPlays: { day: string; count: number }[];
  peakHour: number;
  peakPeriodName: 'Late Night' | 'Morning' | 'Afternoon' | 'Evening';
  nightOwlScore: number; // 0 - 100
}

export interface DiscoveryMetrics {
  newArtistsDiscovered: number;
  newTracksDiscovered: number;
  discoveryVelocity: number; // new per week
  timeline: { date: string; artistCount: number; trackCount: number }[];
  topDiscoveries: { artist: Artist; discoveredAt: string }[];
}

export interface LoyaltyMetrics {
  loyaltyScore: number; // 0 - 100 (repeat listen concentration)
  top5ArtistShare: number; // percentage
  repeatListenRatio: number;
  longestArtistStreakDays: number;
  mostLoyalArtist?: { artistName: string; playCount: number };
}

export interface MusicDiversity {
  diversityScore: number; // 0 - 100 (Shannon entropy)
  uniqueGenresCount: number;
  uniqueArtistsCount: number;
  entropy: number;
  topGenres: GenreStat[];
}

export interface MusicPersona {
  title: string;
  description: string;
  trait1: string;
  trait2: string;
  badge: string;
  gradientClass: string;
}

export interface AnalyticsSummary {
  period: 'all' | 'year' | 'month' | 'week';
  duration: DurationMetrics;
  topArtists: ArtistFrequency[];
  topTracks: TrackFrequency[];
  diversity: MusicDiversity;
  loyalty: LoyaltyMetrics;
  timeDistribution: TimeDistribution;
  discovery: DiscoveryMetrics;
  persona: MusicPersona;
  isDemoData: boolean;
}

// Recap Models
export interface RecapSlide {
  id: string;
  type: 'intro' | 'minutes' | 'top_artist' | 'top_tracks' | 'genres' | 'audio_vibe' | 'discovery' | 'persona' | 'summary';
  title: string;
  subtitle: string;
  data: Record<string, any>;
  accentColor: string;
}

export interface Recap {
  id: string;
  userId: string;
  type: RecapType;
  year?: number | null;
  weekNumber?: number | null;
  title: string;
  summaryData: AnalyticsSummary;
  slides: RecapSlide[];
  isShareable: boolean;
  shareToken?: string | null;
  createdAt: string;
}

// Social Models
export interface FriendWithActivity {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  persona?: string | null;
  friendshipStatus: FriendshipStatus;
  currentlyListening?: {
    trackTitle: string;
    artistName: string;
    coverUrl?: string | null;
    playedAt: string;
    durationMs: number;
  } | null;
  topGenre?: string;
  weeklyListeningMinutes?: number;
}

export interface SongReactionItem {
  id: string;
  trackId: string;
  userId: string;
  username: string;
  displayName: string;
  reactionType: ReactionType;
  createdAt: string;
}

export interface ActivityFeedItem {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  trackId: string;
  trackTitle: string;
  artistName: string;
  coverUrl?: string | null;
  playedAt: string;
  reactions: Record<ReactionType, number>;
  userReaction?: ReactionType | null;
}

export interface FriendGroup {
  id: string;
  name: string;
  description?: string | null;
  creatorId: string;
  creatorName: string;
  memberCount: number;
  members: {
    userId: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    weeklyMinutes: number;
  }[];
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  metricValue: number;
  metricLabel: string;
  badge?: string;
}

export interface TasteComparison {
  user1: { id: string; username: string; displayName: string };
  user2: { id: string; username: string; displayName: string };
  overlapPercentage: number;
  genreAlignmentPercentage: number;
  sharedArtists: string[];
  sharedGenres: string[];
  vibeDescription: string;
}

