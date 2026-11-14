import React, { useEffect, useState } from 'react';
import { X, Sparkles, Disc3, HeartHandshake } from 'lucide-react';
import { apiFetch } from '../../utils/api.js';
import { TasteComparison } from '@tunescope/shared';

interface TasteComparisonModalProps {
  friendId: string;
  friendName: string;
  onClose: () => void;
}

export const TasteComparisonModal: React.FC<TasteComparisonModalProps> = ({
  friendId,
  friendName,
  onClose,
}) => {
  const [comparison, setComparison] = useState<TasteComparison | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadComparison() {
      try {
        setIsLoading(true);
        const data = await apiFetch<TasteComparison>(`/social/compare/${friendId}`);
        setComparison(data);
      } catch (err) {
        console.error('Failed to load taste comparison:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadComparison();
  }, [friendId]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-dark-900 border border-white/10 rounded-3xl max-w-lg w-full p-6 relative overflow-hidden shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-brand-emerald/20 to-brand-cyan/20 border border-brand-emerald/30 text-brand-emerald">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Music Taste Match</h3>
            <p className="text-xs text-slate-400">Comparing your audio DNA with {friendName}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center">
            <Disc3 className="w-10 h-10 text-brand-emerald animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">Analyzing harmonics & overlap...</p>
          </div>
        ) : comparison ? (
          <div className="space-y-6">
            {/* Big Match Score */}
            <div className="text-center p-6 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-cyan/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-brand-emerald/10 rounded-full blur-2xl" />

              <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-emerald via-brand-cyan to-brand-violet">
                {comparison.overlapPercentage}%
              </span>
              <p className="text-sm font-bold text-white mt-1">Taste Compatibility</p>
              <p className="text-xs text-slate-300 mt-2 max-w-xs mx-auto italic">
                "{comparison.vibeDescription}"
              </p>
            </div>

            {/* Shared Artists */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Mutual Favorite Artists ({comparison.sharedArtists.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {comparison.sharedArtists.length > 0 ? (
                  comparison.sharedArtists.map((artist) => (
                    <span
                      key={artist}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-dark-800 border border-white/10 text-white"
                    >
                      {artist}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No mutual artists yet — great opportunity for discovery!</p>
                )}
              </div>
            </div>

            {/* Shared Genres */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Shared Genres ({comparison.sharedGenres.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {comparison.sharedGenres.map((genre) => (
                  <span
                    key={genre}
                    className="text-xs font-medium px-2.5 py-1 rounded-lg bg-brand-violet/10 border border-brand-violet/20 text-purple-300"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition"
            >
              Done
            </button>
          </div>
        ) : (
          <p className="text-center text-rose-400 py-8">Unable to calculate taste match.</p>
        )}
      </div>
    </div>
  );
};

