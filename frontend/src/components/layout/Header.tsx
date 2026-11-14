import React from 'react';
import { Menu, RefreshCw, Sparkles, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSpotify } from '../../context/SpotifyContext.js';
import { useAuth } from '../../context/AuthContext.js';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { status, isSyncing, syncSpotify } = useSpotify();
  const { user } = useAuth();

  return (
    <header className="h-16 border-b border-white/5 bg-dark-900/60 backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobileMenu}
          aria-label="Open mobile navigation"
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 hidden sm:inline">
            Workspace
          </span>
          <span className="text-xs text-slate-600 hidden sm:inline">/</span>
          <span className="text-sm font-semibold text-slate-200">
            Welcome back, {user?.displayName || 'Listener'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {status?.isConnected ? (
          <button
            onClick={() => syncSpotify()}
            disabled={isSyncing}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-200 border border-white/10 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-brand-emerald' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Spotify'}</span>
          </button>
        ) : (
          <Link
            to="/settings"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:border-cyan-500/40 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Connect Spotify</span>
          </Link>
        )}

        <Link to="/profile">
          <img
            src={
              user?.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
            }
            alt={user?.displayName || 'User'}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10 hover:ring-brand-emerald transition"
          />
        </Link>
      </div>
    </header>
  );
};

