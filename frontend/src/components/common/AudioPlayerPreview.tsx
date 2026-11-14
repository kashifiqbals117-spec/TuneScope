import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, Sparkles } from 'lucide-react';

interface AudioPlayerPreviewProps {
  trackTitle: string;
  artistName: string;
  coverUrl?: string | null;
  durationMs?: number;
  previewUrl?: string;
}

export const AudioPlayerPreview: React.FC<AudioPlayerPreviewProps> = ({
  trackTitle,
  artistName,
  coverUrl,
  durationMs = 180000,
  previewUrl,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 2;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-3 bg-dark-900/80 border border-white/10 rounded-xl p-2.5 max-w-sm">
      <div className="relative group flex-shrink-0 cursor-pointer" onClick={togglePlay}>
        <img
          src={coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100'}
          alt={trackTitle}
          className="w-12 h-12 rounded-lg object-cover"
        />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 rounded-lg flex items-center justify-center transition">
          {isPlaying ? (
            <Pause className="w-5 h-5 text-brand-emerald fill-brand-emerald" />
          ) : (
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-white truncate">{trackTitle}</p>
          {isPlaying && (
            <div className="flex items-end gap-0.5 h-3 ml-2">
              <span className="w-0.5 bg-brand-emerald animate-pulse h-3"></span>
              <span className="w-0.5 bg-brand-emerald animate-pulse h-2"></span>
              <span className="w-0.5 bg-brand-emerald animate-pulse h-4"></span>
              <span className="w-0.5 bg-brand-emerald animate-pulse h-1.5"></span>
            </div>
          )}
        </div>
        <p className="text-[11px] text-slate-400 truncate">{artistName}</p>

        {/* Progress bar */}
        <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-brand-emerald to-brand-cyan h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

