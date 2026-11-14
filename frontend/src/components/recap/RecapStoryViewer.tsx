import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Share2,
  Check,
  Disc3,
  Flame,
  Sparkles,
  Trophy,
  Compass,
  Clock,
  Heart,
} from 'lucide-react';
import { RecapSlide, Recap } from '@tunescope/shared';
import { AudioPlayerPreview } from '../common/AudioPlayerPreview.js';

interface RecapStoryViewerProps {
  recap: Recap;
  onClose: () => void;
}

export const RecapStoryViewer: React.FC<RecapStoryViewerProps> = ({ recap, onClose }) => {
  const slides: RecapSlide[] = (recap.slides as any) || [];
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentSlide = slides[currentSlideIndex] || slides[0];

  // Auto-advance slides every 6 seconds unless paused
  useEffect(() => {
    if (isPaused) return;

    const timer = setTimeout(() => {
      if (currentSlideIndex < slides.length - 1) {
        setCurrentSlideIndex((prev) => prev + 1);
      }
    }, 6000);

    return () => clearTimeout(timer);
  }, [currentSlideIndex, isPaused, slides.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlideIndex]);

  const nextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/recap/share/${recap.shareToken || recap.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!currentSlide) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-0 sm:p-4 select-none">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Story Mobile Container */}
      <div
        className="relative w-full max-w-md h-full sm:h-[820px] sm:rounded-3xl overflow-hidden bg-gradient-to-b from-dark-900 to-dark-950 border border-white/10 flex flex-col justify-between shadow-2xl"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Top Progress Bars */}
        <div className="absolute top-3 inset-x-3 z-30 flex items-center gap-1.5">
          {slides.map((slide, idx) => (
            <div key={slide.id || idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  idx < currentSlideIndex
                    ? 'w-full bg-white'
                    : idx === currentSlideIndex
                    ? 'w-full bg-brand-emerald animate-pulse'
                    : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Header Branding */}
        <div className="pt-8 px-6 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <Disc3 className="w-4 h-4 text-brand-emerald animate-spin-slow" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
              TuneScope Recap
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {currentSlideIndex + 1} / {slides.length}
          </span>
        </div>

        {/* Slide Content Dynamic Rendering */}
        <div className="flex-1 flex flex-col justify-center px-6 py-4 z-20 overflow-y-auto">
          {currentSlide.type === 'intro' && (
            <div className="text-center space-y-6">
              <div className="inline-block p-4 rounded-3xl bg-gradient-to-tr from-brand-emerald/20 to-brand-cyan/20 border border-brand-emerald/30 shadow-glow-emerald">
                <Sparkles className="w-16 h-16 text-brand-emerald animate-bounce" />
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                {currentSlide.title}
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed max-w-xs mx-auto">
                {currentSlide.subtitle}
              </p>
              <div className="pt-4">
                <span className="text-xs bg-white/10 text-white px-3 py-1.5 rounded-full font-semibold">
                  Tap right to begin →
                </span>
              </div>
            </div>
          )}

          {currentSlide.type === 'minutes' && (
            <div className="text-center space-y-6">
              <Clock className="w-12 h-12 text-brand-violet mx-auto" />
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Total Immersion
                </p>
                <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-violet to-brand-cyan mt-2">
                  {currentSlide.data.totalMinutes?.toLocaleString()}
                </h2>
                <p className="text-lg font-bold text-slate-200 mt-1">Minutes Listened</p>
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto pt-4">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <p className="text-xs text-slate-400">Daily Average</p>
                  <p className="text-xl font-extrabold text-white mt-1">
                    {currentSlide.data.dailyAverageMinutes}m
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <p className="text-xs text-slate-400">Active Days</p>
                  <p className="text-xl font-extrabold text-brand-emerald mt-1">
                    {currentSlide.data.activeListeningDays}d
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentSlide.type === 'top_artist' && (
            <div className="text-center space-y-5">
              <Trophy className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                #1 Most Played Artist
              </p>

              {currentSlide.data.artist && (
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <img
                      src={
                        currentSlide.data.artist.imageUrl ||
                        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'
                      }
                      alt={currentSlide.data.artist.artistName}
                      className="w-48 h-48 rounded-full object-cover mx-auto ring-4 ring-amber-400/30 shadow-2xl shadow-amber-500/20"
                    />
                    <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                      <span className="text-xs font-bold bg-amber-500 text-black px-3 py-1 rounded-full shadow-md">
                        Top Loyalist
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-white">
                      {currentSlide.data.artist.artistName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {currentSlide.data.artist.playCount} total scrobbles
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentSlide.type === 'top_tracks' && (
            <div className="space-y-4">
              <div className="text-center">
                <Flame className="w-8 h-8 text-rose-500 mx-auto" />
                <h3 className="text-2xl font-black text-white mt-1">Your Top 5 Anthems</h3>
                <p className="text-xs text-slate-400">The tracks soundtracking your year</p>
              </div>

              <div className="space-y-2.5 mt-4">
                {(currentSlide.data.tracks || []).slice(0, 5).map((track: any, index: number) => (
                  <div
                    key={track.trackId || index}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10"
                  >
                    <span className="text-base font-black text-brand-emerald w-5 text-center">
                      {index + 1}
                    </span>
                    <img
                      src={track.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100'}
                      alt={track.title}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{track.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{track.artistName}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-300">
                      {track.playCount}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentSlide.type === 'genres' && (
            <div className="text-center space-y-5">
              <Sparkles className="w-10 h-10 text-brand-fuchsia mx-auto" />
              <div>
                <h3 className="text-2xl font-black text-white">Sonic Spectrum</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Diversity Score: {currentSlide.data.diversity?.diversityScore}/100
                </p>
              </div>

              <div className="space-y-2.5 max-w-xs mx-auto">
                {(currentSlide.data.topGenres || []).slice(0, 5).map((g: any) => (
                  <div key={g.genre} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-200">
                      <span>{g.genre}</span>
                      <span className="text-brand-fuchsia">{g.percentage}%</span>
                    </div>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-brand-violet to-brand-fuchsia h-full rounded-full"
                        style={{ width: `${g.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentSlide.type === 'discovery' && (
            <div className="text-center space-y-6">
              <Compass className="w-12 h-12 text-brand-cyan mx-auto animate-pulse" />
              <div>
                <p className="text-xs font-bold text-brand-cyan uppercase tracking-wider">
                  Exploration Velocity
                </p>
                <h2 className="text-4xl font-extrabold text-white mt-1">
                  {currentSlide.data.discovery?.newArtistsDiscovered || 0}
                </h2>
                <p className="text-sm text-slate-300 mt-1">Brand New Artists Discovered</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 max-w-xs mx-auto text-left">
                <p className="text-xs text-slate-400 font-semibold mb-2">Notable Discoveries</p>
                <div className="space-y-2">
                  {(currentSlide.data.discovery?.topDiscoveries || []).slice(0, 3).map((d: any, i: number) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
                      <p className="text-xs font-semibold text-white truncate">
                        {d.artist?.name || 'Artist'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentSlide.type === 'persona' && (
            <div className="text-center space-y-6">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-600/30 via-indigo-600/30 to-cyan-500/30 border border-white/20 shadow-glow-violet max-w-xs mx-auto">
                <span className="text-xs font-black uppercase tracking-widest text-brand-cyan bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 inline-block mb-3">
                  {currentSlide.data.persona?.badge || 'Music Persona'}
                </span>
                <h3 className="text-2xl font-black text-white leading-tight">
                  {currentSlide.data.persona?.title || 'The Sonic Pioneer'}
                </h3>
                <p className="text-xs text-slate-200 mt-3 leading-relaxed">
                  {currentSlide.data.persona?.description}
                </p>
                <div className="pt-4 flex flex-wrap gap-2 justify-center">
                  <span className="text-[10px] bg-white/10 text-white font-semibold px-2.5 py-1 rounded-lg">
                    {currentSlide.data.persona?.trait1}
                  </span>
                  <span className="text-[10px] bg-white/10 text-white font-semibold px-2.5 py-1 rounded-lg">
                    {currentSlide.data.persona?.trait2}
                  </span>
                </div>
              </div>
            </div>
          )}

          {currentSlide.type === 'summary' && (
            <div className="text-center space-y-5">
              <div className="p-5 rounded-2xl bg-dark-850 border border-white/10 shadow-xl max-w-xs mx-auto space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="text-left">
                    <p className="text-xs text-slate-400">TuneScope Recap</p>
                    <p className="text-sm font-bold text-white">
                      {currentSlide.data.user?.displayName}
                    </p>
                  </div>
                  <Disc3 className="w-6 h-6 text-brand-emerald" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-left text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Minutes</span>
                    <strong className="text-white text-sm">
                      {currentSlide.data.summary?.duration?.totalMinutes?.toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Diversity</span>
                    <strong className="text-brand-emerald text-sm">
                      {currentSlide.data.summary?.diversity?.diversityScore}/100
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Top Artist</span>
                    <strong className="text-white truncate block">
                      {currentSlide.data.summary?.topArtists?.[0]?.artistName || 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Persona</span>
                    <strong className="text-brand-cyan truncate block">
                      {currentSlide.data.summary?.persona?.title?.split(' ')[1] || 'Explorer'}
                    </strong>
                  </div>
                </div>
              </div>

              <button
                onClick={copyShareLink}
                className="w-full max-w-xs mx-auto py-3 rounded-xl bg-gradient-to-r from-brand-emerald to-brand-cyan text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg hover:opacity-95 transition"
              >
                {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {copied ? 'Share Link Copied!' : 'Share Recap Card'}
              </button>
            </div>
          )}
        </div>

        {/* Navigation Touch Areas */}
        <div className="absolute inset-y-16 left-0 w-1/3 z-10 cursor-pointer" onClick={prevSlide} />
        <div className="absolute inset-y-16 right-0 w-1/3 z-10 cursor-pointer" onClick={nextSlide} />

        {/* Footer controls */}
        <div className="p-4 border-t border-white/5 flex items-center justify-between z-20">
          <button
            onClick={prevSlide}
            disabled={currentSlideIndex === 0}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs text-slate-500 font-medium">
            Tap sides or press Space
          </span>
          <button
            onClick={nextSlide}
            disabled={currentSlideIndex === slides.length - 1}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

