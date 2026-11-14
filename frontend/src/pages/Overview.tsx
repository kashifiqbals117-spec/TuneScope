import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api.js';
import { AnalyticsSummary, ActivityFeedItem } from '@tunescope/shared';
import { GlassCard } from '../components/common/GlassCard.js';
import { DemoBanner } from '../components/common/DemoBanner.js';
import { ListeningActivityChart } from '../components/charts/ListeningActivityChart.js';
import { HourlyHeatmap } from '../components/charts/HourlyHeatmap.js';
import { AudioPlayerPreview } from '../components/common/AudioPlayerPreview.js';
import { useAuth } from '../context/AuthContext.js';

export const Overview: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [recentFeed, setRecentFeed] = useState<ActivityFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setIsLoading(true);
        const [sumData, feedData] = await Promise.all([
          apiFetch<AnalyticsSummary>('/analytics/summary?period=all'),
          apiFetch<ActivityFeedItem[]>('/social/activity?limit=4'),
        ]);
        setSummary(sumData);
        setRecentFeed(feedData);
      } catch (err) {
        console.error('Failed to load overview data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (isLoading || !summary) {
    return (
      <div className="py-24 text-center">
        <Disc3 className="w-12 h-12 text-brand-emerald animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-400">Loading your music universe...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Demo Mode Notice */}
      <DemoBanner />

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-brand-emerald/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-brand-cyan/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Persona: {summary.persona.badge}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {summary.persona.title}
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              {summary.persona.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Link
              to="/recaps"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-emerald to-brand-cyan text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:opacity-95 transition"
            >
              <Sparkles className="w-4 h-4" />
              View 2026 Wrapped
              <ArrowRight className="w-4 h-4" />
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
              {summary.duration.totalHours.toLocaleString()} <span className="text-sm font-semibold text-slate-400">hrs</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              ~{summary.duration.dailyAverageMinutes} mins per active day
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
            <p className="text-xs text-amber-400 mt-1 font-semibold">
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
              {summary.diversity.diversityScore}<span className="text-sm font-normal text-slate-400">/100</span>
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
              <h3 className="text-base font-bold text-white">Listening Activity</h3>
              <p className="text-xs text-slate-400">Scrobbles distributed over days of the week</p>
            </div>
            <span className="text-xs font-semibold text-brand-emerald bg-emerald-500/10 px-2.5 py-1 rounded-lg">
              Active Habit
            </span>
          </div>
          <ListeningActivityChart data={summary.timeDistribution.dayOfWeekPlays} />
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">24h Rhythm</h3>
              <p className="text-xs text-slate-400">
                Peak: {summary.timeDistribution.peakHour}:00 ({summary.timeDistribution.peakPeriodName})
              </p>
            </div>
            <span className="text-xs font-bold text-brand-violet bg-purple-500/10 px-2 py-1 rounded-lg">
              {summary.timeDistribution.nightOwlScore}% Night Owl
            </span>
          </div>
          <HourlyHeatmap
            data={summary.timeDistribution.hourlyPlays}
            peakHour={summary.timeDistribution.peakHour}
          />
        </GlassCard>
      </div>

      {/* Top Artists & Top Tracks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Artists */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Top Artists</h3>
              <p className="text-xs text-slate-400">Ranked by overall listening volume</p>
            </div>
            <Link
              to="/artists"
              className="text-xs font-semibold text-brand-cyan hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {summary.topArtists.slice(0, 5).map((artist, idx) => (
              <div
                key={artist.artistId}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 text-sm font-black text-slate-500 text-center">
                    {idx + 1}
                  </span>
                  <img
                    src={artist.imageUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100'}
                    alt={artist.artistName}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{artist.artistName}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {artist.genres.slice(0, 2).join(', ') || 'Alternative'}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-extrabold text-slate-200">
                    {artist.playCount} plays
                  </span>
                  <span className="text-[10px] text-slate-400 block">
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

          <div className="space-y-3">
            {summary.topTracks.slice(0, 5).map((track, idx) => (
              <div
                key={track.trackId}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 text-sm font-black text-slate-500 text-center">
                    {idx + 1}
                  </span>
                  <img
                    src={track.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100'}
                    alt={track.title}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{track.title}</p>
                    <p className="text-xs text-slate-400 truncate">{track.artistName}</p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-extrabold text-brand-emerald">
                    {track.playCount} plays
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Friends Listening Activity Widget */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-emerald/10 text-brand-emerald">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Friends' Live Activity</h3>
              <p className="text-xs text-slate-400">What friends are vibing to right now</p>
            </div>
          </div>
          <Link
            to="/friends"
            className="text-xs font-semibold text-brand-cyan hover:underline flex items-center gap-1"
          >
            Social Feed <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentFeed.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-dark-900/80 border border-white/5 space-y-3"
            >
              <div className="flex items-center gap-2.5">
                <img
                  src={item.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                  alt={item.displayName}
                  className="w-7 h-7 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{item.displayName}</p>
                  <span className="text-[10px] text-slate-400">Listened recently</span>
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
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

