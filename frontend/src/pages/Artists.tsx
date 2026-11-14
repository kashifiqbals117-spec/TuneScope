import React, { useEffect, useState } from 'react';
import { Mic2, Trophy, Flame, Disc3, Search, Sparkles } from 'lucide-react';
import { apiFetch } from '../utils/api.js';
import { ArtistFrequency, LoyaltyMetrics } from '@tunescope/shared';
import { GlassCard } from '../components/common/GlassCard.js';
import { Badge } from '../components/common/Badge.js';

export const Artists: React.FC = () => {
  const [artists, setArtists] = useState<ArtistFrequency[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyMetrics | null>(null);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<'all' | 'year' | 'month' | 'week'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadArtists() {
      try {
        setIsLoading(true);
        const data = await apiFetch<{ artists: ArtistFrequency[]; loyalty: LoyaltyMetrics }>(
          `/analytics/artists?period=${period}`
        );
        setArtists(data.artists);
        setLoyalty(data.loyalty);
      } catch (err) {
        console.error('Failed to load artists:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadArtists();
  }, [period]);

  const filteredArtists = artists.filter((a) =>
    a.artistName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Top Artists</h1>
          <p className="text-sm text-slate-400 mt-1">
            Discover the musicians and creators defining your auditory journey.
          </p>
        </div>

        <div className="flex bg-dark-900 border border-white/10 rounded-xl p-1 gap-1 self-start sm:self-auto">
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

      {/* Loyalty Index Spotlight */}
      {loyalty && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GlassCard>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Loyalty Score</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-extrabold text-white mt-3">
              {loyalty.loyaltyScore}<span className="text-sm font-normal text-slate-400">/100</span>
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
            <p className="text-3xl font-extrabold text-brand-emerald mt-3">
              {loyalty.top5ArtistShare}%
            </p>
            <p className="text-xs text-slate-400 mt-1">Of all streaming volume</p>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Most Loyal Subject</span>
              <Sparkles className="w-4 h-4 text-brand-cyan" />
            </div>
            <p className="text-xl font-extrabold text-white truncate mt-3">
              {loyalty.mostLoyalArtist?.artistName || 'None'}
            </p>
            <p className="text-xs text-cyan-400 mt-1 font-medium">
              {loyalty.mostLoyalArtist?.playCount || 0} devoted plays
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
          className="w-full bg-dark-900 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-emerald/50 transition"
        />
      </div>

      {/* Artists Grid */}
      {isLoading ? (
        <div className="py-24 text-center">
          <Disc3 className="w-10 h-10 text-brand-emerald animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-medium">Ranking your artists...</p>
        </div>
      ) : filteredArtists.length === 0 ? (
        <div className="py-20 text-center text-slate-400">
          <Mic2 className="w-10 h-10 mx-auto mb-2 text-slate-600" />
          <p className="text-sm font-semibold">No artists found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArtists.map((artist) => (
            <GlassCard key={artist.artistId} hoverEffect className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    <img
                      src={
                        artist.imageUrl ||
                        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120'
                      }
                      alt={artist.artistName}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/10"
                    />
                    <span className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full bg-dark-900 border border-brand-emerald/40 text-[10px] font-black text-brand-emerald flex items-center justify-center">
                      #{artist.rank}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white truncate">
                      {artist.artistName}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {artist.genres.slice(0, 2).map((g) => (
                        <span
                          key={g}
                          className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-300"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Plays</span>
                  <strong className="text-white font-bold">{artist.playCount}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Time</span>
                  <strong className="text-slate-200 font-bold">
                    {Math.round(artist.durationMs / 60000)} mins
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Share</span>
                  <strong className="text-brand-emerald font-bold">{artist.percentage}%</strong>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

