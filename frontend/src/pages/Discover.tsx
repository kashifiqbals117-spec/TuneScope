import React, { useEffect, useState } from 'react';
import { Compass, Sparkles, TrendingUp, Calendar, Disc3, ArrowRight } from 'lucide-react';
import { apiFetch } from '../utils/api.js';
import { DiscoveryMetrics, MusicDiversity } from '@tunescope/shared';
import { GlassCard } from '../components/common/GlassCard.js';
import { GenreRadar } from '../components/charts/GenreRadar.js';
import { CardSkeleton, ChartSkeleton } from '../components/common/Skeleton.js';
import { ErrorMessage } from '../components/common/ErrorMessage.js';

export const Discover: React.FC = () => {
  const [discovery, setDiscovery] = useState<DiscoveryMetrics | null>(null);
  const [diversity, setDiversity] = useState<MusicDiversity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [discData, sumData] = await Promise.all([
        apiFetch<DiscoveryMetrics>('/analytics/discovery'),
        apiFetch<{ diversity: MusicDiversity }>('/analytics/summary'),
      ]);
      setDiscovery(discData || null);
      setDiversity(sumData?.diversity || null);
    } catch (err: any) {
      console.error('Failed to load discovery data:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-white/5 rounded-xl animate-pulse" />
          <div className="h-4 w-96 bg-white/5 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton height="h-80" />
          <ChartSkeleton height="h-80" />
        </div>
      </div>
    );
  }

  if (error || !discovery) {
    return (
      <div className="py-12 max-w-xl mx-auto space-y-4">
        <ErrorMessage error={error} onRetry={loadData} />
      </div>
    );
  }

  const radarData = (diversity?.topGenres || []).slice(0, 6).map((g) => ({
    trait: g.genre,
    value: Math.min(100, g.percentage * 2.5),
  }));

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Music Discovery</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Explore your discovery velocity, sonic radar, and the roadmap of new artists entering your rotation.
        </p>
      </div>

      {/* Discovery Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">New Artists Discovered</span>
            <Compass className="w-4 h-4 text-brand-cyan" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
            {discovery.newArtistsDiscovered}
          </p>
          <p className="text-xs text-brand-cyan mt-1 font-medium">
            First-time listens logged
          </p>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Discovery Velocity</span>
            <TrendingUp className="w-4 h-4 text-brand-emerald" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
            {discovery.discoveryVelocity} <span className="text-xs font-normal text-slate-400">/ week</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">Average new sonic introductions</p>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Unique Genres</span>
            <Sparkles className="w-4 h-4 text-brand-violet" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
            {diversity?.uniqueGenresCount || 0}
          </p>
          <p className="text-xs text-purple-400 mt-1 font-medium">
            Diversity score: {diversity?.diversityScore}/100
          </p>
        </GlassCard>
      </div>

      {/* Sonic Radar & Top Discoveries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Sonic Genre Radar</h3>
              <p className="text-xs text-slate-400">Multi-dimensional genre spread</p>
            </div>
            <span className="text-xs font-bold text-brand-violet bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg">
              Entropy Spectrum
            </span>
          </div>
          <GenreRadar data={radarData} />
        </GlassCard>

        {/* Notable Discoveries */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Notable New Discoveries</h3>
              <p className="text-xs text-slate-400">Artists you embraced recently</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {discovery.topDiscoveries.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3.5 rounded-xl bg-dark-950/60 border border-white/[0.04] hover:border-white/[0.08] transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={
                      item.artist?.imageUrl ||
                      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100'
                    }
                    alt={item.artist?.name}
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0 ring-1 ring-brand-cyan/20"
                  />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-white truncate">{item.artist?.name}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {item.artist?.genres?.slice(0, 2).join(', ') || 'Eclectic'}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-xs text-slate-400 flex items-center gap-1 justify-end font-mono">
                    <Calendar className="w-3 h-3 text-brand-cyan" />
                    {new Date(item.discoveredAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="text-[10px] text-brand-emerald font-semibold block mt-0.5">
                    Discovered
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
