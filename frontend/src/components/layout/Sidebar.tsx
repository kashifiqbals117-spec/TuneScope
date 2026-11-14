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
  Settings,
  LogOut,
  Disc3,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useSpotify } from '../../context/SpotifyContext.js';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, logout } = useAuth();
  const { status } = useSpotify();

  const navItems = [
    { label: 'Overview', to: '/', icon: LayoutDashboard },
    { label: 'Discover', to: '/discover', icon: Compass },
    { label: 'Listening History', to: '/history', icon: History },
    { label: 'Artists', to: '/artists', icon: Mic2 },
    { label: 'Tracks', to: '/tracks', icon: Music2 },
    { label: 'Recaps', to: '/recaps', icon: Sparkles, badge: 'Wrapped' },
    { label: 'Friends', to: '/friends', icon: Users2 },
    { label: 'Profile', to: '/profile', icon: UserCircle },
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-dark-900 border-r border-white/5 flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-emerald via-brand-cyan to-brand-violet flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
            <Disc3 className="w-6 h-6 text-black animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              TuneScope
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-brand-emerald">
              Music Intelligence
            </p>
          </div>
        </NavLink>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-emerald/15 to-brand-cyan/10 text-white border border-brand-emerald/25 shadow-sm shadow-emerald-950/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-fuchsia-500 to-brand-violet text-white px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Spotify Connection Badge in Sidebar */}
      <div className="px-4 py-3 mx-3 mb-3 rounded-xl bg-dark-850 border border-white/5 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-slate-400 font-medium">Spotify Link</span>
          <span
            className={`w-2 h-2 rounded-full ${
              status?.isConnected ? 'bg-brand-spotify animate-pulse' : 'bg-slate-600'
            }`}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white font-semibold">
            {status?.isConnected ? 'Connected' : 'Demo Mode'}
          </span>
          <NavLink
            to="/settings"
            className="text-[11px] text-brand-cyan hover:underline flex items-center gap-0.5"
          >
            Configure <ExternalLink className="w-2.5 h-2.5" />
          </NavLink>
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-white/5 bg-dark-950/50 flex items-center justify-between">
        <NavLink
          to="/profile"
          className="flex items-center gap-3 min-w-0 group"
          onClick={onCloseMobile}
        >
          <img
            src={
              user?.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
            }
            alt={user?.displayName || 'User'}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-brand-emerald transition"
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate group-hover:text-brand-emerald transition">
              {user?.displayName || 'Music Fan'}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {user?.persona || 'Listener'}
            </p>
          </div>
        </NavLink>

        <button
          onClick={logout}
          title="Sign Out"
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

