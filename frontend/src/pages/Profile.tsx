import React, { useState, useEffect } from 'react';
import {
  UserCircle,
  Edit3,
  Shield,
  Sparkles,
  Music2,
  Clock,
  Compass,
  Disc3,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { apiFetch } from '../utils/api.js';
import { AnalyticsSummary, PrivacySetting } from '@tunescope/shared';
import { GlassCard } from '../components/common/GlassCard.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { GenreRadar } from '../components/charts/GenreRadar.js';

export const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [privacySetting, setPrivacySetting] = useState<PrivacySetting>(
    user?.privacySetting || PrivacySetting.PUBLIC
  );
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadSummary() {
      try {
        setIsLoading(true);
        const data = await apiFetch<AnalyticsSummary>('/analytics/summary?period=all');
        setSummary(data);
      } catch (err) {
        console.error('Failed to load profile summary:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSummary();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaveStatus(null);
      await updateProfile({
        displayName,
        bio,
        avatarUrl,
        privacySetting,
      });
      setSaveStatus('Profile updated successfully!');
      setTimeout(() => {
        setIsEditing(false);
        setSaveStatus(null);
      }, 1200);
    } catch (err: any) {
      setSaveStatus(err.message || 'Failed to update profile');
    }
  };

  const radarData = (summary?.diversity?.topGenres || []).slice(0, 6).map((g) => ({
    trait: g.genre,
    value: Math.min(100, g.percentage * 2.5),
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Profile Card */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-violet/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <img
            src={
              user?.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
            }
            alt={user?.displayName}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-white/10 shadow-xl"
          />

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-3xl font-extrabold text-white">{user?.displayName}</h1>
              <Badge variant="emerald" size="sm">
                @{user?.username}
              </Badge>
              <Badge variant={user?.privacySetting === 'PUBLIC' ? 'cyan' : 'muted'} size="sm">
                <Shield className="w-3 h-3" />
                {user?.privacySetting}
              </Badge>
            </div>

            <p className="text-sm text-slate-300 max-w-lg">
              {user?.bio || 'Music enthusiast exploring sonic boundaries.'}
            </p>

            <div className="pt-2">
              <span className="text-xs font-bold text-brand-emerald bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Persona: {user?.persona || 'The Cosmic Explorer'}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={<Edit3 className="w-4 h-4" />}
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Lifetime Stats Row */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GlassCard>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Lifetime Hours</span>
              <Clock className="w-4 h-4 text-brand-emerald" />
            </div>
            <p className="text-3xl font-extrabold text-white mt-3">
              {summary.duration.totalHours} <span className="text-sm font-semibold text-slate-400">hrs</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">Across all synced sources</p>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Total Scrobbles</span>
              <Music2 className="w-4 h-4 text-brand-cyan" />
            </div>
            <p className="text-3xl font-extrabold text-white mt-3">
              {summary.duration.totalPlays.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 mt-1">Tracks completed</p>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Diversity Index</span>
              <Compass className="w-4 h-4 text-brand-violet" />
            </div>
            <p className="text-3xl font-extrabold text-brand-violet mt-3">
              {summary.diversity.diversityScore}/100
            </p>
            <p className="text-xs text-slate-400 mt-1">Multi-genre audio DNA</p>
          </GlassCard>
        </div>
      )}

      {/* Sonic Spectrum Radar & Genres */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Audio Spectrum</h3>
              <p className="text-xs text-slate-400">Your psychological sound profile</p>
            </div>
          </div>
          <GenreRadar data={radarData} />
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Signature Genres</h3>
              <p className="text-xs text-slate-400">Top sonic realms you frequent</p>
            </div>
          </div>

          <div className="space-y-3">
            {(summary?.diversity?.topGenres || []).map((genre) => (
              <div key={genre.genre} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-200">
                  <span>{genre.genre}</span>
                  <span className="text-brand-emerald">{genre.percentage}%</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-brand-emerald to-brand-cyan h-full rounded-full"
                    style={{ width: `${genre.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Edit Profile</h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-emerald"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-emerald"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Avatar URL</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-emerald"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Privacy Setting</label>
                <select
                  value={privacySetting}
                  onChange={(e) => setPrivacySetting(e.target.value as PrivacySetting)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-emerald"
                >
                  <option value={PrivacySetting.PUBLIC}>Public (Visible to everyone)</option>
                  <option value={PrivacySetting.FRIENDS_ONLY}>Friends Only</option>
                  <option value={PrivacySetting.PRIVATE}>Private</option>
                </select>
              </div>

              {saveStatus && (
                <p className="text-xs text-brand-emerald bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                  {saveStatus}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

