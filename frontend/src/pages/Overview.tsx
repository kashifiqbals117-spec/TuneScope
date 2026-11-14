import React, { useEffect, useState, useCallback } from 'react';
import {
  Clock,
  Music,
  Trophy,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Compass,
  Disc3,
  Users,
  ShieldCheck,
  AlertTriangle,
  Play,
  Flame,
  Heart,
  Repeat,
  Radio,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api.js';
import { AnalyticsSummary, ActivityFeedItem } from '@tunescope/shared';
import { GlassCard } from '../components/common/GlassCard.js';
import { DemoBanner } from '../components/common/DemoBanner.js';
import { ListeningActivityChart } from '../components/charts/ListeningActivityChart.js';
import { HourlyHeatmap } from '../components/charts/HourlyHeatmap.js';
import { AudioPlayerPreview } from '../components/common/AudioPlayerPreview.js';
import { CardSkeleton, ChartSkeleton } from '../components/common/Skeleton.js';
import { ErrorMessage } from '../components/common/ErrorMessage.js';
import { useAuth } from '../context/AuthContext.js';
import { useSpotify } from '../context/SpotifyContext.js';
import { useToast } from '../context/ToastContext.js';

interface RecentHistoryItem {
  id: string;
  playedAt: string;
  source: string;
  track: {
    id: string;
    title: string;
    artistName: string;
    albumTitle?: string;
    coverUrl?: string;
    previewUrl?: string;
    durationMs: number;
  };
}

export const Overview: React.FC = () => {
  const { user } = useAuth();
  const { status, isSyncing, syncSpotify } = useSpotify();
  const toast = useToast();

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [recentHistory, setRecentHistory] = useState<RecentHistoryItem[]>([]);
  const [recentFeed, setRecentFeed] = useState<ActivityFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [sumData, feedData, historyData] = await Promise.all([
        apiFetch<AnalyticsSummary>('/analytics/summary?period=all'),
        apiFetch<ActivityFeedItem[]>('/social/activity?limit=4'),
        apiFetch<{ events: RecentHistoryItem[] }>('/music/history?limit=5').catch(() => ({ events: [] })),
      ]);
      setSummary(sumData);
      setRecentFeed(feedData);
      setRecentHistory(historyData.events || []);
    } catch (err: any) {
      console.error('Failed to load overview data:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleQuickSync = async () => {
    try {
      const res = await syncSpotify();
      toast.success(`Synced ${res.ingestedCount} tracks from Spotify!`);
      loadDashboard();
    } catch (err: any) {
      toast.error(err.message || 'Sync failed. Check Spotify permissions in Settings.');
    }
  };

  const handleQuickReaction = async (feedId: string, emoji: string) => {
    try {
      await apiFetch(`/social/activity/${feedId}/react`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      });
      toast.success(`Sent reaction ${emoji}`);
      // Refresh feed
      const updated = await apiFetch<ActivityFeedItem[]>('/social/activity?limit=4');
      setRecentFeed(updated);
    } catch (err: any) {
      toast.error(err.message || 'Could not send reaction');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="p-8 rounded-3xl bg-dark-900 border border-white/5 space-y-4">
          <div className="h-6 w-32 bg-white/5 rounded-full animate-pulse" />
          <div className="h-10 w-64 bg-white/5 rounded-xl animate-pulse" />
          <div className="h-4 w-96 bg-white/5 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartSkeleton height="h-72" />
          <ChartSkeleton height="h-72" />
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="py-12 max-w-xl mx-auto space-y-4">
        <ErrorMessage error={error} onRetry={loadDashboard} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Demonstration Banner or Spotify Notice */}
      <DemoBanner />

      {/* Hero Welcome Header */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-dark-900 border border-white/[0.08] shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-brand-emerald/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-72 h-72 bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                {summary.persona.badge}
              </span>

              {/* Spotify Status Pill */}
              {status?.verified ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-spotify/10 border border-brand-spotify/20 text-brand-spotify text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Spotify Verified
                </span>
              ) : status?.hasStoredCredentials ? (
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium hover:bg-amber-500/20 transition"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  API Restricted (Settings)
                </Link>
              ) : (
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white text-xs font-medium transition"
                >
                  Connect Spotify
                </Link>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {summary.persona.title}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {summary.persona.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
            {status?.verified && (
              <button
                onClick={handleQuickSync}
                disabled={isSyncing}
                className="px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-200 border border-white/10 text-xs font-semibold inline-flex items-center gap-2 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-brand-emerald' : 'text-slate-400'}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Spotify'}</span>
              </button>
            )}

            <Link
              to="/recaps"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-emerald to-brand-cyan text-black font-extrabold text-xs inline-flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:opacity-95 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch 2026 Wrapped</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Key Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Listening Time</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-brand-violet">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-white tracking-tight">
              {summary.duration.totalHours.toLocaleString()} <span className="text-xs font-normal text-slate-400">hrs</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              ~{summary.duration.dailyAverageMinutes} mins / active day
            </p>
          </div>
        </GlassCard>

        <GlassCard hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Scrobbles</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-brand-cyan">
              <Music className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-white tracking-tight">
              {summary.duration.totalPlays.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Across {summary.diversity.uniqueArtistsCount} unique artists
            </p>
          </div>
        </GlassCard>

        <GlassCard hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Top Artist</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl font-extrabold text-white truncate">
              {summary.topArtists[0]?.artistName || 'Undiscovered'}
            </p>
            <p className="text-xs text-amber-400 mt-1 font-semibold truncate">
              {summary.topArtists[0]?.playCount || 0} plays ({summary.loyalty.top5ArtistShare}% top-5 share)
            </p>
          </div>
        </GlassCard>

        <GlassCard hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Diversity Index</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-brand-emerald">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-white tracking-tight">
              {summary.diversity.diversityScore}<span className="text-xs font-normal text-slate-400">/100</span>
            </p>
            <p className="text-xs text-brand-emerald mt-1 font-medium">
              {summary.diversity.uniqueGenresCount} distinct genres explored
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Charts Section: Activity & 24h Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Weekly Listening Pattern</h3>
              <p className="text-xs text-slate-400">Permitted listening telemetry aggregated by weekday</p>
            </div>
            <span className="text-xs font-semibold text-brand-emerald bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              Permitted Analysis
            </span>
          </div>
          <ListeningActivityChart data={summary.timeDistribution.dayOfWeekPlays} />
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">24h Sonic Rhythm</h3>
              <p className="text-xs text-slate-400">
                Peak: {summary.timeDistribution.peakHour}:00 ({summary.timeDistribution.peakPeriodName})
              </p>
            </div>
            <span className="text-xs font-bold text-brand-violet bg-purple-500/10 px-2 py-1 rounded-lg border border-purple-500/20">
              {summary.timeDistribution.nightOwlScore}% Night Owl
            </span>
          </div>
          <HourlyHeatmap
            data={summary.timeDistribution.hourlyPlays}
            peakHour={summary.timeDistribution.peakHour}
          />
        </GlassCard>
      </div>

      {/* Recently Played & Discovery Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Played */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Recently Played</h3>
              <p className="text-xs text-slate-400">Your latest scrobbles and streaming records</p>
            </div>
            <Link
              to="/history"
              className="text-xs font-semibold text-brand-cyan hover:underline flex items-center gap-1"
            >
              Full History <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentHistory.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <Radio className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-xs font-semibold text-slate-300">No recent scrobbles yet</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Connect Spotify in Settings or import scrobble records
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-dark-850/60 border border-white/[0.04] hover:border-white/[0.08] transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.track.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=80'}
                      alt={item.track.title}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{item.track.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{item.track.artistName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                      {new Date(item.playedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-white/5 text-slate-300 border border-white/5">
                      {item.source}
                    </span>
                    {item.track.previewUrl && (
                      <AudioPlayerPreview
                        trackTitle={item.track.title}
                        artistName={item.track.artistName}
                        coverUrl={item.track.coverUrl}
                        previewUrl={item.track.previewUrl}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Music Discovery Section */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Music Discovery</h3>
              <p className="text-xs text-slate-400">Your evolving taste landscape and sonic footprint</p>
            </div>
            <Link
              to="/discover"
              className="text-xs font-semibold text-brand-cyan hover:underline flex items-center gap-1"
            >
              Explore Radar <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-dark-850/60 border border-white/[0.04] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white">Exploration Score</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Diversity index of genres & artists</p>
              </div>
              <span className="text-lg font-black text-brand-cyan">
                {summary.diversity.diversityScore}%
              </span>
            </div>

            <div className="p-4 rounded-xl bg-dark-850/60 border border-white/[0.04] space-y-2">
              <span className="text-xs font-bold text-white block">Top Genres in Rotation</span>
              <div className="flex flex-wrap gap-1.5">
                {(summary.diversity.topGenres || []).slice(0, 5).map((genre) => (
                  <span
                    key={genre.genre}
                    className="px-2.5 py-1 rounded-lg text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium"
                  >
                    {genre.genre} ({genre.percentage}%)
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/30 to-cyan-950/30 border border-purple-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-violet flex-shrink-0" />
                <span className="text-slate-200">Ready to explore your sound map?</span>
              </div>
              <Link
                to="/discover"
                className="text-xs font-bold text-brand-cyan hover:underline flex items-center gap-0.5"
              >
                Go to Discover <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Top Artists & Top Anthems */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Artists */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Top Artists</h3>
              <p className="text-xs text-slate-400">Ranked by total play frequency</p>
            </div>
            <Link
              to="/artists"
              className="text-xs font-semibold text-brand-cyan hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {summary.topArtists.slice(0, 5).map((artist, idx) => (
              <div
                key={artist.artistId}
                className="flex items-center justify-between p-3 rounded-xl bg-dark-850/60 border border-white/[0.04] hover:border-white/[0.08] transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-5 text-xs font-black text-center ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                    #{idx + 1}
                  </span>
                  <img
                    src={artist.imageUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100'}
                    alt={artist.artistName}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{artist.artistName}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {artist.genres.slice(0, 2).join(', ') || 'Alternative'}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-extrabold text-slate-200">
                    {artist.playCount} plays
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {Math.round(artist.durationMs / 60000)} mins
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Top Anthems */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Top Anthems</h3>
              <p className="text-xs text-slate-400">Your most replayed soundtracks</p>
            </div>
            <Link
              to="/tracks"
              className="text-xs font-semibold text-brand-cyan hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {summary.topTracks.slice(0, 5).map((track, idx) => (
              <div
                key={track.trackId}
                className="flex items-center justify-between p-3 rounded-xl bg-dark-850/60 border border-white/[0.04] hover:border-white/[0.08] transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-5 text-xs font-black text-center ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                    #{idx + 1}
                  </span>
                  <img
                    src={track.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100'}
                    alt={track.title}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{track.title}</p>
                    <p className="text-[11px] text-slate-400 truncate">{track.artistName}</p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-extrabold text-brand-emerald">
                    {track.playCount} plays
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Friends' Activity Section */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-emerald/10 text-brand-emerald">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Friends' Activity</h3>
              <p className="text-xs text-slate-400">Recent music activity across your network</p>
            </div>
          </div>
          <Link
            to="/friends"
            className="text-xs font-semibold text-brand-cyan hover:underline flex items-center gap-1"
          >
            Social Hub <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentFeed.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-dark-850/60 border border-white/[0.04] space-y-3"
            >
              <div className="flex items-center gap-2.5">
                <img
                  src={item.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                  alt={item.displayName}
                  className="w-7 h-7 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{item.displayName}</p>
                  <span className="text-[10px] text-slate-500">Listened recently</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <img
                  src={item.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=80'}
                  alt={item.trackTitle}
                  className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{item.trackTitle}</p>
                  <p className="text-[11px] text-slate-400 truncate">{item.artistName}</p>
                </div>
              </div>

              {/* Reaction triggers */}
              <div className="flex items-center gap-1 pt-1 border-t border-white/[0.04]">
                {[
                  { emoji: '🔥', icon: Flame },
                  { emoji: '❤️', icon: Heart },
                  { emoji: '🔁', icon: Repeat },
                ].map(({ emoji }) => (
                  <button
                    key={emoji}
                    onClick={() => handleQuickReaction(item.id, emoji)}
                    className="p-1 rounded-lg hover:bg-white/5 text-xs text-slate-400 hover:text-white transition"
                    title={`React ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};
