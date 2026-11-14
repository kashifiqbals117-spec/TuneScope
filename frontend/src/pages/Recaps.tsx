import React, { useEffect, useState } from 'react';
import { Sparkles, Play, Share2, Calendar, Disc3, Clock, Trophy, Check, Plus } from 'lucide-react';
import { apiFetch } from '../utils/api.js';
import { Recap } from '@tunescope/shared';
import { GlassCard } from '../components/common/GlassCard.js';
import { Button } from '../components/common/Button.js';
import { RecapStoryViewer } from '../components/recap/RecapStoryViewer.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { ErrorMessage } from '../components/common/ErrorMessage.js';
import { CardSkeleton } from '../components/common/Skeleton.js';
import { useToast } from '../context/ToastContext.js';

export const Recaps: React.FC = () => {
  const toast = useToast();
  const [recaps, setRecaps] = useState<Recap[]>([]);
  const [activeRecap, setActiveRecap] = useState<Recap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<any>(null);

  const loadRecaps = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiFetch<Recap[]>('/recaps');
      setRecaps(data || []);
    } catch (err: any) {
      console.error('Failed to load recaps:', err);
      setError(err);
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
      setError(null);
      await apiFetch('/recaps/generate', {
        method: 'POST',
        body: JSON.stringify({ type, year: 2026, weekNumber: 45 }),
      });
      toast.success(`Successfully generated your ${type.toLowerCase()} recap story!`);
      await loadRecaps();
    } catch (err: any) {
      console.error('Failed to generate recap:', err);
      toast.error(err.message || 'Unable to generate recap right now. Please try again.');
      setError(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyShareLink = (recap: Recap) => {
    const url = `${window.location.origin}/recap/share/${recap.shareToken || recap.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(recap.id);
    toast.success('Share link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Header & Generate Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            TuneScope Recaps
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Immersive Wrapped story decks, weekly milestones, and shareable music memories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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

      {error && <ErrorMessage error={error} onRetry={loadRecaps} />}

      {/* Recaps Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton className="h-64" />
          <CardSkeleton className="h-64" />
        </div>
      ) : recaps.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No Recaps Generated Yet"
          description="Create your first 2026 Wrapped experience or weekly summary to view your animated story deck."
          actionText="Generate 2026 Wrapped"
          onAction={() => handleGenerate('YEARLY')}
          actionIcon={<Sparkles className="w-4 h-4" />}
          secondaryText="Generate Weekly Recap"
          onSecondaryAction={() => handleGenerate('WEEKLY')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recaps.map((recap) => {
            const summary = recap.summaryData as any;
            const isYearly = recap.type === 'YEARLY';

            return (
              <div
                key={recap.id}
                className="relative overflow-hidden rounded-3xl p-6 bg-dark-900 border border-white/[0.08] hover:border-brand-emerald/30 transition-all duration-200 group shadow-xl"
              >
                {/* Subtle Glow Aura */}
                <div
                  className={`absolute top-0 right-0 w-44 h-44 rounded-full blur-3xl opacity-10 pointer-events-none ${
                    isYearly ? 'bg-brand-emerald' : 'bg-brand-violet'
                  }`}
                />

                <div className="relative z-10 space-y-5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        isYearly
                          ? 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20'
                          : 'bg-brand-violet/10 text-brand-violet border-brand-violet/20'
                      }`}
                    >
                      {recap.type === 'YEARLY' ? 'Year in Music' : 'Weekly Recap'}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(recap.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">{recap.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {summary?.persona?.title || 'The Sound Explorer'} ·{' '}
                      {summary?.duration?.totalMinutes
                        ? `${summary.duration.totalMinutes.toLocaleString()} minutes listened`
                        : `${summary?.duration?.totalHours || 0} hours`}
                    </p>
                  </div>

                  {/* Highlights Snapshot */}
                  <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-dark-950/60 border border-white/[0.05] text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                        Top Artist
                      </span>
                      <strong className="text-white truncate block mt-0.5">
                        {summary?.topArtists?.[0]?.artistName || 'Undiscovered'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                        Diversity
                      </span>
                      <strong className="text-brand-emerald block mt-0.5">
                        {summary?.diversity?.diversityScore || 75}/100
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                        New Artists
                      </span>
                      <strong className="text-brand-cyan block mt-0.5">
                        {summary?.discovery?.newArtistsDiscovered || 0}
                      </strong>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setActiveRecap(recap)}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-brand-emerald to-brand-cyan text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-emerald-500/15 transition active:scale-[0.98]"
                    >
                      <Play className="w-4 h-4 fill-black" />
                      <span>Launch Story Mode</span>
                    </button>

                    <button
                      onClick={() => copyShareLink(recap)}
                      title="Share Recap URL"
                      className="p-3 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 border border-white/10 hover:border-white/20 transition"
                      aria-label="Share recap"
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
