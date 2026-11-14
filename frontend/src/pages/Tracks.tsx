import React, { useEffect, useState } from 'react';
import { Music2, Play, Pause, Search, Disc3, Sparkles, X, Trophy } from 'lucide-react';
import { apiFetch } from '../utils/api.js';
import { TrackFrequency } from '@tunescope/shared';
import { GlassCard } from '../components/common/GlassCard.js';
import { AudioPlayerPreview } from '../components/common/AudioPlayerPreview.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { ErrorMessage } from '../components/common/ErrorMessage.js';
import { CardSkeleton } from '../components/common/Skeleton.js';

export const Tracks: React.FC = () => {
  const [tracks, setTracks] = useState<TrackFrequency[]>([]);
  const [period, setPeriod] = useState<'all' | 'year' | 'month' | 'week'>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [selectedTrack, setSelectedTrack] = useState<TrackFrequency | null>(null);

  const loadTracks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiFetch<{ tracks: TrackFrequency[] }>(
        `/analytics/tracks?period=${period}`
      );
      setTracks(data.tracks || []);
      if (data.tracks && data.tracks.length > 0 && !selectedTrack) {
        setSelectedTrack(data.tracks[0]);
      }
    } catch (err: any) {
      console.error('Failed to load tracks:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTracks();
  }, [period]);

  const filteredTracks = tracks.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.artistName.toLowerCase().includes(search.toLowerCase())
  );

  const formatDuration = (ms: number) => {
    if (!ms || ms <= 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Top Anthems</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            The defining hooks, melodies, and anthems dominating your streaming activity.
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

      {/* Floating Audio Preview Player */}
      {selectedTrack && !isLoading && (
        <GlassCard className="p-4 bg-dark-900 border-white/[0.1] flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-emerald bg-brand-emerald/10 border border-brand-emerald/20 px-2.5 py-1 rounded-lg">
              Preview Player
            </span>
            <span className="text-xs text-slate-300 truncate max-w-xs sm:max-w-md">
              Now cueing: <strong>{selectedTrack.title}</strong> by {selectedTrack.artistName}
            </span>
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

      {error && <ErrorMessage error={error} onRetry={loadTracks} />}

      {/* Tracks Grid & List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredTracks.length === 0 ? (
        <EmptyState
          icon={Music2}
          title={search ? 'No tracks match your query' : 'No track data recorded'}
          description={
            search
              ? `No tracks or artists matched "${search}". Try checking the spelling or reset your query.`
              : 'Connect Spotify or import listening records to see your top songs ranked.'
          }
          actionText={search ? 'Clear Search' : 'Go to Settings'}
          onAction={() => (search ? setSearch('') : (window.location.href = '/settings'))}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTracks.map((track) => {
            const isSelected = selectedTrack?.trackId === track.trackId;
            const rankBadgeColor =
              track.rank === 1
                ? 'bg-amber-400 text-black border-amber-300'
                : track.rank === 2
                ? 'bg-slate-200 text-black border-slate-100'
                : track.rank === 3
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-dark-800 text-slate-400 border-white/10';

            return (
              <GlassCard
                key={track.trackId}
                hoverEffect
                onClick={() => setSelectedTrack(track)}
                className={`p-4 cursor-pointer transition-all duration-200 space-y-3 relative overflow-hidden ${
                  isSelected ? 'border-brand-emerald/40 bg-emerald-500/[0.04]' : ''
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative flex-shrink-0">
                    <img
                      src={
                        track.coverUrl ||
                        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100'
                      }
                      alt={track.title}
                      className="w-14 h-14 rounded-xl object-cover ring-1 ring-white/10 shadow-md"
                    />
                    <span
                      className={`absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full border text-[10px] font-black flex items-center justify-center shadow-lg ${rankBadgeColor}`}
                    >
                      #{track.rank}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white truncate">{track.title}</h3>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{track.artistName}</p>
                    {track.albumTitle && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {track.albumTitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">
                      Play Count
                    </span>
                    <strong className="text-brand-emerald font-extrabold">{track.playCount} plays</strong>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">
                      Duration
                    </span>
                    <span className="text-slate-300 font-mono">
                      {formatDuration(track.durationMs)}
                    </span>
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
