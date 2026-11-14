import React, { useEffect, useState } from 'react';
import { Sparkles, Play, Share2, Calendar, Disc3, Clock, Trophy, Check } from 'lucide-react';
import { apiFetch } from '../utils/api.js';
import { Recap } from '@tunescope/shared';
import { GlassCard } from '../components/common/GlassCard.js';
import { Button } from '../components/common/Button.js';
import { RecapStoryViewer } from '../components/recap/RecapStoryViewer.js';

export const Recaps: React.FC = () => {
  const [recaps, setRecaps] = useState<Recap[]>([]);
  const [activeRecap, setActiveRecap] = useState<Recap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadRecaps = async () => {
    try {
      setIsLoading(true);
      const data = await apiFetch<Recap[]>('/recaps');
      setRecaps(data);
    } catch (err) {
      console.error('Failed to load recaps:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecaps();
  }, []);

  const handleGenerate = async (type: 'YEARLY' | 'WEEKLY') => {
    try {
      setIsGenerating(true);
      await apiFetch('/recaps/generate', {
        method: 'POST',
        body: JSON.stringify({ type, year: 2026, weekNumber: 45 }),
      });
      await loadRecaps();
    } catch (err) {
      console.error('Failed to generate recap:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyShareLink = (recap: Recap) => {
    const url = `${window.location.origin}/recap/share/${recap.shareToken || recap.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(recap.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Generate Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">TuneScope Recaps</h1>
          <p className="text-sm text-slate-400 mt-1">
            Immersive Wrapped story decks, weekly milestones, and shareable music memories.
          </p>
        </div>

        <div className="flex gap-2.5">
          <Button
            variant="secondary"
            size="md"
            isLoading={isGenerating}
            onClick={() => handleGenerate('WEEKLY')}
          >
            Generate Weekly
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<Sparkles className="w-4 h-4" />}
            isLoading={isGenerating}
            onClick={() => handleGenerate('YEARLY')}
          >
            New 2026 Wrapped
          </Button>
        </div>
      </div>

      {/* Recaps Grid */}
      {isLoading ? (
        <div className="py-24 text-center">
          <Disc3 className="w-10 h-10 text-brand-emerald animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-medium">Gathering your Wrapped chronicles...</p>
        </div>
      ) : recaps.length === 0 ? (
        <GlassCard className="py-16 text-center space-y-4">
          <Sparkles className="w-12 h-12 text-brand-emerald mx-auto" />
          <h3 className="text-lg font-bold text-white">No Recaps Generated Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Generate your first 2026 Wrapped experience or weekly summary to view your animated story deck.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => handleGenerate('YEARLY')}
            isLoading={isGenerating}
          >
            Create 2026 Wrapped Now
          </Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recaps.map((recap) => {
            const summary = recap.summaryData as any;
            const isYearly = recap.type === 'YEARLY';

            return (
              <div
                key={recap.id}
                className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-dark-900 to-dark-850 border border-white/10 hover:border-brand-emerald/40 transition group shadow-xl"
              >
                {/* Glow aura */}
                <div
                  className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
                    isYearly ? 'bg-brand-emerald' : 'bg-brand-violet'
                  }`}
                />

                <div className="relative z-10 space-y-5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                        isYearly
                          ? 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20'
                          : 'bg-brand-violet/10 text-brand-violet border border-brand-violet/20'
                      }`}
                    >
                      {recap.type}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(recap.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-white">{recap.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {summary?.persona?.title || 'The Cosmic Explorer'} ·{' '}
                      {summary?.duration?.totalMinutes?.toLocaleString()} minutes listened
                    </p>
                  </div>

                  {/* Highlights Snapshot */}
                  <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Top Artist</span>
                      <strong className="text-white truncate block mt-0.5">
                        {summary?.topArtists?.[0]?.artistName || 'Undiscovered'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Diversity</span>
                      <strong className="text-brand-emerald block mt-0.5">
                        {summary?.diversity?.diversityScore}/100
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Discovered</span>
                      <strong className="text-brand-cyan block mt-0.5">
                        {summary?.discovery?.newArtistsDiscovered || 0} artists
                      </strong>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setActiveRecap(recap)}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-brand-emerald to-brand-cyan text-black font-extrabold text-sm flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-emerald-500/20 transition"
                    >
                      <Play className="w-4 h-4 fill-black" />
                      Launch Story Mode
                    </button>

                    <button
                      onClick={() => copyShareLink(recap)}
                      title="Share Recap"
                      className="p-3 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-200 border border-white/10 transition"
                    >
                      {copiedId === recap.id ? (
                        <Check className="w-4 h-4 text-brand-emerald" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Story Viewer Modal */}
      {activeRecap && (
        <RecapStoryViewer
          recap={activeRecap}
          onClose={() => setActiveRecap(null)}
        />
      )}
    </div>
  );
};

