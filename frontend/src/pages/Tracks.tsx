import React, { useEffect, useState } from 'react';
import { Music2, Play, Pause, Search, Disc3, Sparkles } from 'lucide-react';
import { apiFetch } from '../utils/api.js';
import { TrackFrequency } from '@tunescope/shared';
import { GlassCard } from '../components/common/GlassCard.js';
import { Badge } from '../components/common/Badge.js';
import { AudioPlayerPreview } from '../components/common/AudioPlayerPreview.js';

export const Tracks: React.FC = () => {
  const [tracks, setTracks] = useState<TrackFrequency[]>([]);
  const [period, setPeriod] = useState<'all' | 'year' | 'month' | 'week'>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState<TrackFrequency | null>(null);

  useEffect(() => {
    async function loadTracks() {
      try {
        setIsLoading(true);
        const data = await apiFetch<{ tracks: TrackFrequency[] }>(
          `/analytics/tracks?period=${period}`
        );
        setTracks(data.tracks);
        if (data.tracks.length > 0 && !selectedTrack) {
          setSelectedTrack(data.tracks[0]);
        }
      } catch (err) {
        console.error('Failed to load tracks:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadTracks();
  }, [period]);

  const filteredTracks = tracks.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.artistName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Top Tracks</h1>
          <p className="text-sm text-slate-400 mt-1">
            The definitive anthems, hooks, and melodies dominating your audio space.
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

      {/* Floating Audio Preview Player */}
      {selectedTrack && (
        <GlassCard className="p-4 bg-gradient-to-r from-dark-900 to-dark-850 flex flex-wrap items-center justify-between gap-4 border-brand-emerald/30 shadow-glow-emerald">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-emerald bg-brand-emerald/10 px-2.5 py-1 rounded-lg">
              Active Preview
            </span>
            <span className="text-xs text-slate-300">Click any anthem to listen</span>
          </div>

          <AudioPlayerPreview
            trackTitle={selectedTrack.title}
            artistName={selectedTrack.artistName}
            coverUrl={selectedTrack.coverUrl}
            durationMs={selectedTrack.durationMs}
          />
        </GlassCard>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter tracks by title or artist..."
          className="w-full bg-dark-900 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-emerald/50 transition"
        />
      </div>

      {/* Tracks List */}
      <GlassCard className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center">
            <Disc3 className="w-10 h-10 text-brand-emerald animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">Crunching your top anthems...</p>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Music2 className="w-10 h-10 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-semibold">No tracks found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredTracks.map((track) => (
              <div
                key={track.trackId}
                onClick={() => setSelectedTrack(track)}
                className={`flex items-center justify-between p-4 cursor-pointer transition ${
                  selectedTrack?.trackId === track.trackId
                    ? 'bg-brand-emerald/10 border-l-4 border-brand-emerald'
                    : 'hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="w-6 text-sm font-black text-slate-500 text-center flex-shrink-0">
                    {track.rank}
                  </span>
                  <img
                    src={
                      track.coverUrl ||
                      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100'
                    }
                    alt={track.title}
                    className="w-11 h-11 rounded-xl object-cover flex-shrink-0 ring-1 ring-white/10"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{track.title}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {track.artistName} {track.albumTitle ? `• ${track.albumTitle}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  {track.audioFeatures && (
                    <div className="hidden md:flex items-center gap-2">
                      <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-300">
                        ⚡ {Math.round((track.audioFeatures.energy || 0.7) * 100)}% Energy
                      </span>
                      <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-300">
                        🕺 {Math.round((track.audioFeatures.danceability || 0.6) * 100)}% Dance
                      </span>
                    </div>
                  )}

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-brand-emerald">
                      {track.playCount} plays
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {Math.floor(track.durationMs / 60000)}:
                      {Math.floor((track.durationMs % 60000) / 1000)
                        .toString()
                        .padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

