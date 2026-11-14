import React, { useEffect, useState } from 'react';
import { Mic2, Trophy, Flame, Disc3, Search, Sparkles, X } from 'lucide-react';
import { apiFetch } from '../utils/api.js';
import { ArtistFrequency, LoyaltyMetrics } from '@tunescope/shared';
import { GlassCard } from '../components/common/GlassCard.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { ErrorMessage } from '../components/common/ErrorMessage.js';
import { CardSkeleton } from '../components/common/Skeleton.js';

export const Artists: React.FC = () => {
  const [artists, setArtists] = useState<ArtistFrequency[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyMetrics | null>(null);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<'all' | 'year' | 'month' | 'week'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const loadArtists = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiFetch<{ artists: ArtistFrequency[]; loyalty: LoyaltyMetrics }>(
        `/analytics/artists?period=${period}`
      );
      setArtists(data.artists || []);
      setLoyalty(data.loyalty || null);
    } catch (err: any) {
      console.error('Failed to load artists:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArtists();
  }, [period]);

  const filteredArtists = artists.filter((a) =>
    a.artistName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Top Artists</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            The creators and musical personalities shaping your listening identity.
          </p>
        </div>

        {/* Time Period Selector */}
        <div className="flex bg-dark-900 border border-white/[0.08] rounded-xl p-1 gap-1 self-start sm:self-auto">
          {(['all', 'year', 'month', 'week'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                period === p
                  ? 'bg-brand-emerald text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {p === 'all' ? 'All Time' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Loyalty Index Spotlight Cards */}
      {loyalty && !isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GlassCard>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Loyalty Score</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
              {loyalty.loyaltyScore}<span className="text-xs font-normal text-slate-400">/100</span>
            </p>
            <p className="text-xs text-amber-400 mt-1 font-medium">
              Repeat listen concentration
            </p>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Top 5 Artist Share</span>
              <Trophy className="w-4 h-4 text-brand-emerald" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-brand-emerald mt-3">
              {loyalty.top5ArtistShare}%
            </p>
            <p className="text-xs text-slate-400 mt-1">Of all recorded streaming volume</p>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Most Devoted Artist</span>
              <Sparkles className="w-4 h-4 text-brand-cyan" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-white truncate mt-3">
              {loyalty.mostLoyalArtist?.artistName || 'Undiscovered'}
            </p>
            <p className="text-xs text-cyan-400 mt-1 font-medium">
              {loyalty.mostLoyalArtist?.playCount || 0} devoted scrobbles
            </p>
          </GlassCard>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter artists by name..."
          className="w-full bg-dark-900 border border-white/[0.08] rounded-2xl pl-11 pr-10 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-emerald/50 transition"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {error && <ErrorMessage error={error} onRetry={loadArtists} />}

      {/* Artists Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredArtists.length === 0 ? (
        <EmptyState
          icon={Mic2}
          title={search ? 'No artists match your search' : 'No artist analytics available'}
          description={
            search
              ? `No artists found matching "${search}". Try checking for typos or clear your filter.`
              : 'Connect Spotify or import listening records to populate your top artist rankings.'
          }
          actionText={search ? 'Clear Search' : 'Go to Settings'}
          onAction={() => (search ? setSearch('') : (window.location.href = '/settings'))}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredArtists.map((artist) => {
            const isPodium = artist.rank <= 3;
            const rankBadgeColor =
              artist.rank === 1
                ? 'bg-amber-400 text-black border-amber-300'
                : artist.rank === 2
                ? 'bg-slate-200 text-black border-slate-100'
                : artist.rank === 3
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-dark-800 text-slate-400 border-white/10';

            return (
              <GlassCard
                key={artist.artistId}
                hoverEffect
                className="space-y-4 p-5 relative overflow-hidden"
              >
                <div className="flex items-start gap-3.5">
                  <div className="relative flex-shrink-0">
                    <img
                      src={
                        artist.imageUrl ||
                        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120'
                      }
                      alt={artist.artistName}
                      className="w-14 h-14 rounded-2xl object-cover ring-1 ring-white/10 shadow-md"
                    />
                    <span
                      className={`absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full border text-[10px] font-black flex items-center justify-center shadow-lg ${rankBadgeColor}`}
                    >
                      #{artist.rank}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-white truncate">
                      {artist.artistName}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {artist.genres.slice(0, 2).map((g) => (
                        <span
                          key={g}
                          className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded-md text-slate-300 font-medium"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.06] grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                      Plays
                    </span>
                    <strong className="text-white font-bold">{artist.playCount}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                      Time
                    </span>
                    <strong className="text-slate-200 font-bold">
                      {Math.round(artist.durationMs / 60000)}m
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                      Share
                    </span>
                    <strong className="text-brand-emerald font-bold">{artist.percentage}%</strong>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
