import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  History,
  Mic2,
  Music2,
  Sparkles,
  Users2,
  UserCircle,
  Settings as SettingsIcon,
  LogOut,
  Disc3,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useSpotify } from '../../context/SpotifyContext.js';

interface SidebarProps {
  onCloseMobile?: () => void;
}

interface NavSection {
  title: string;
  items: {
    label: string;
    to: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, logout } = useAuth();
  const { status } = useSpotify();

  const sections: NavSection[] = [
    {
      title: 'DISCOVER',
      items: [
        { label: 'Overview', to: '/', icon: LayoutDashboard },
        { label: 'Discover', to: '/discover', icon: Compass },
      ],
    },
    {
      title: 'MY MUSIC',
      items: [
        { label: 'Listening History', to: '/history', icon: History },
        { label: 'Artists', to: '/artists', icon: Mic2 },
        { label: 'Tracks', to: '/tracks', icon: Music2 },
        { label: 'Recaps', to: '/recaps', icon: Sparkles, badge: 'Wrapped' },
      ],
    },
    {
      title: 'SOCIAL',
      items: [
        { label: 'Friends', to: '/friends', icon: Users2 },
        { label: 'Profile', to: '/profile', icon: UserCircle },
      ],
    },
    {
      title: 'SETTINGS',
      items: [
        { label: 'Settings', to: '/settings', icon: SettingsIcon },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-dark-900 border-r border-white/[0.07] flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/[0.07] flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-3 group" onClick={onCloseMobile}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-emerald via-brand-cyan to-brand-violet flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
            <Disc3 className="w-6 h-6 text-black animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
              TuneScope
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-brand-emerald">
              Music Intelligence
            </p>
          </div>
        </NavLink>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase px-3 mb-1">
              {section.title}
            </p>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-emerald-500/10 text-white border border-brand-emerald/25 shadow-sm shadow-emerald-950/40'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r from-fuchsia-500 to-brand-violet text-white px-1.5 py-0.5 rounded-full shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Spotify Connection Widget in Sidebar */}
      <div className="px-3 pb-3">
        <div className="p-3 rounded-xl bg-dark-850/80 border border-white/[0.06] text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1.5">
              {status?.verified ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-brand-spotify animate-pulse" />
                  Spotify Live
                </>
              ) : status?.hasStoredCredentials ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  API Restricted
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-600" />
                  Spotify
                </>
              )}
            </span>
            <NavLink
              to="/settings"
              onClick={onCloseMobile}
              className="text-[10px] text-brand-cyan hover:underline flex items-center gap-0.5 font-medium"
            >
              Configure <ExternalLink className="w-2.5 h-2.5" />
            </NavLink>
          </div>
          <p className="text-[11px] text-slate-300 font-semibold truncate">
            {status?.verified
              ? 'Synced & Verified'
              : status?.hasStoredCredentials
              ? 'OAuth Connected'
              : 'Demo Telemetry'}
          </p>
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="p-3.5 border-t border-white/[0.07] bg-dark-950/70 flex items-center justify-between">
        <NavLink
          to="/profile"
          className="flex items-center gap-2.5 min-w-0 group"
          onClick={onCloseMobile}
        >
          <img
            src={
              user?.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
            }
            alt={user?.displayName || 'User'}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10 group-hover:ring-brand-emerald transition-all flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate group-hover:text-brand-emerald transition-colors">
              {user?.displayName || 'Music Fan'}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {user?.persona || 'Active Listener'}
            </p>
          </div>
        </NavLink>

        <button
          onClick={logout}
          title="Sign Out"
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
