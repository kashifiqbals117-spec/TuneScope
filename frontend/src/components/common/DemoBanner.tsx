import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSpotify } from '../../context/SpotifyContext.js';

export const DemoBanner: React.FC = () => {
  const { status } = useSpotify();

  if (status?.verified) {
    return (
      <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-2xl px-4 py-3 mb-6 flex flex-wrap items-center justify-between gap-3 text-sm text-emerald-300">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>
            <strong className="font-semibold text-emerald-200">Spotify Live Connected & Verified</strong> — Syncing permitted listening telemetry from your official Spotify account.
          </span>
        </div>
        <Link
          to="/settings"
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition"
        >
          Manage Connection
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  if (status?.hasStoredCredentials && !status?.verified) {
    return (
      <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl px-4 py-3 mb-6 flex flex-wrap items-center justify-between gap-3 text-sm text-amber-300">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></div>
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            <strong className="font-semibold text-amber-200">Spotify Authorized (API Restricted)</strong> — OAuth credentials stored, but Spotify Web API requires active Premium on the app owner. Showing demo data.
          </span>
        </div>
        <Link
          to="/settings"
          className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition"
        >
          View API Status
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-purple-950/40 via-dark-850 to-cyan-950/30 border border-purple-500/20 rounded-2xl px-5 py-3.5 mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex-shrink-0">
          <Sparkles className="w-4 h-4 animate-spin-slow" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
              Demo Mode Active
            </span>
            <span className="text-xs text-slate-400">Realistic Simulated Music Telemetry</span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Displaying high-fidelity demonstration scrobbles, top artists, and Wrapped analytics. Connect your Spotify account in Settings to analyze your personal listening habits!
          </p>
        </div>
      </div>
      <Link
        to="/settings"
        className="text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-600 hover:opacity-95 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-purple-950/40 flex-shrink-0"
      >
        Connect Spotify
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
};

