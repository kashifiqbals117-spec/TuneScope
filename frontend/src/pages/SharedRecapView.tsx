import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Disc3, Sparkles, ArrowRight, Play } from 'lucide-react';
import { apiFetch } from '../utils/api.js';
import { Recap } from '@tunescope/shared';
import { RecapStoryViewer } from '../components/recap/RecapStoryViewer.js';

export const SharedRecapView: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [recap, setRecap] = useState<Recap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isViewingStory, setIsViewingStory] = useState(false);

  useEffect(() => {
    async function loadShared() {
      try {
        setIsLoading(true);
        const data = await apiFetch<Recap>(`/recaps/share/${shareToken}`);
        setRecap(data);
      } catch (err: any) {
        setError(err.message || 'Recap not found or sharing has been disabled.');
      } finally {
        setIsLoading(false);
      }
    }
    loadShared();
  }, [shareToken]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-6 text-center">
        <Disc3 className="w-12 h-12 text-brand-emerald animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400">Loading Shared Recap...</p>
      </div>
    );
  }

  if (error || !recap) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-4 rounded-3xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Recap Unavailable</h2>
        <p className="text-sm text-slate-400 max-w-sm">{error}</p>
        <Link
          to="/"
          className="text-xs font-semibold text-brand-emerald bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 hover:bg-emerald-500/20 transition"
        >
          Go to TuneScope Home
        </Link>
      </div>
    );
  }

  const summary = recap.summaryData as any;

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="max-w-md w-full rounded-3xl bg-dark-900 border border-white/10 p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-emerald/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Disc3 className="w-5 h-5 text-brand-emerald" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
              TuneScope
            </span>
          </div>
          <span className="text-xs font-semibold text-brand-cyan bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
            {recap.type}
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white">{recap.title}</h1>
          <p className="text-sm text-slate-300">
            {summary?.persona?.title || 'The Sonic Explorer'}
          </p>
          <p className="text-xs text-slate-400">
            Curated music identity & milestones
          </p>
        </div>

        {/* Stats card */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Total Listening</span>
            <strong className="text-white text-base block mt-0.5">
              {summary?.duration?.totalMinutes?.toLocaleString()} mins
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Diversity Index</span>
            <strong className="text-brand-emerald text-base block mt-0.5">
              {summary?.diversity?.diversityScore}/100
            </strong>
          </div>
          <div className="col-span-2 pt-2 border-t border-white/5">
            <span className="text-slate-400 block text-[10px]">Top Artist</span>
            <strong className="text-white text-sm block mt-0.5">
              {summary?.topArtists?.[0]?.artistName || 'Artist'}
            </strong>
          </div>
        </div>

        <button
          onClick={() => setIsViewingStory(true)}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-emerald to-brand-cyan text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl hover:opacity-95 transition"
        >
          <Play className="w-5 h-5 fill-black" />
          Watch Animated Wrapped Story
        </button>

        <div className="text-center pt-2">
          <Link
            to="/register"
            className="text-xs text-slate-400 hover:text-white transition inline-flex items-center gap-1"
          >
            Create your own music intelligence profile <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {isViewingStory && (
        <RecapStoryViewer
          recap={recap}
          onClose={() => setIsViewingStory(false)}
        />
      )}
    </div>
  );
};

