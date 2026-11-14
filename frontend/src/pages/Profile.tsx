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
  X,
  Save,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useSpotify } from '../context/SpotifyContext.js';
import { useToast } from '../context/ToastContext.js';
import { apiFetch } from '../utils/api.js';
import { AnalyticsSummary, PrivacySetting } from '@tunescope/shared';
import { GlassCard } from '../components/common/GlassCard.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { GenreRadar } from '../components/charts/GenreRadar.js';
import { ErrorMessage } from '../components/common/ErrorMessage.js';
import { CardSkeleton, ChartSkeleton } from '../components/common/Skeleton.js';

export const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { status: spotifyStatus, checkStatus: refreshSpotifyStatus, connectSpotify } = useSpotify();
  const toast = useToast();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<any>(null);
  const [spotifyFeedback, setSpotifyFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    title: string;
    message: string;
  } | null>(null);

  // Edit fields
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [privacySetting, setPrivacySetting] = useState<PrivacySetting>(
    user?.privacySetting || PrivacySetting.PUBLIC
  );
  const [isSaving, setIsSaving] = useState(false);

  // Check URL params for OAuth callback return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const spotifyParam = params.get('spotify');
    const messageParam = params.get('message');

    if (spotifyParam) {
      refreshSpotifyStatus();

      if (spotifyParam === 'connected') {
        setSpotifyFeedback({
          type: 'success',
          title: 'Spotify Connected Successfully!',
          message: 'Your Spotify account has been successfully verified and connected to your TuneScope profile.',
        });
        toast.success('Spotify account linked and verified!');
      } else if (spotifyParam === 'restricted') {
        setSpotifyFeedback({
          type: 'warning',
          title: 'Spotify Access Restricted',
          message:
            messageParam ||
            'Spotify credentials authorized, but Web API access returned HTTP 403. In Development Mode, your Spotify account email must be added under User Management in the Spotify Developer Dashboard.',
        });
        toast.warning('Spotify authorized, but API access is restricted');
      } else if (spotifyParam === 'error') {
        setSpotifyFeedback({
          type: 'error',
          title: 'Spotify Authorization Issue',
          message: messageParam || 'Spotify authorization was denied or timed out.',
        });
        toast.error(messageParam || 'Spotify authorization was cancelled or failed');
      }

      // Clean up query parameters from browser address bar
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loadSummary = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiFetch<AnalyticsSummary>('/analytics/summary?period=all');
      setSummary(data);
    } catch (err: any) {
      console.error('Failed to load profile summary:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await updateProfile({
        displayName,
        bio,
        avatarUrl,
        privacySetting,
      });
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const radarData = (summary?.diversity?.topGenres || []).slice(0, 6).map((g) => ({
    trait: g.genre,
    value: Math.min(100, g.percentage * 2.5),
  }));

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
        <div className="p-8 rounded-3xl bg-dark-900 border border-white/5 space-y-4">
          <div className="h-20 w-20 rounded-full bg-white/5 animate-pulse" />
          <div className="h-8 w-48 bg-white/5 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-7xl mx-auto">
      {error && <ErrorMessage error={error} onRetry={loadSummary} />}

      {/* Spotify OAuth Feedback Banner */}
      {spotifyFeedback && (
        <div
          className={`p-4 rounded-2xl border flex items-start justify-between gap-3 animate-fade-in ${
            spotifyFeedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : spotifyFeedback.type === 'warning'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {spotifyFeedback.type === 'success' ? (
              <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            )}
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">{spotifyFeedback.title}</h4>
              <p className="text-xs opacity-90 leading-relaxed">{spotifyFeedback.message}</p>
            </div>
          </div>
          <button
            onClick={() => setSpotifyFeedback(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Profile Card */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-dark-900 border border-white/[0.08] shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-violet/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <img
            src={
              user?.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
            }
            alt={user?.displayName}
            className="w-24 h-24 rounded-full object-cover ring-2 ring-white/10 shadow-xl flex-shrink-0"
          />

          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white truncate">
                {user?.displayName}
              </h1>
              <Badge variant="emerald" size="sm">
                @{user?.username}
              </Badge>
              <Badge variant={user?.privacySetting === 'PUBLIC' ? 'cyan' : 'muted'} size="sm">
                <Shield className="w-3 h-3" />
                {user?.privacySetting}
              </Badge>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
              {user?.bio || 'Music enthusiast exploring sonic boundaries.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-bold text-brand-emerald bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Persona: {user?.persona || 'The Cosmic Explorer'}
              </span>

              {spotifyStatus?.isConnected && spotifyStatus?.verified ? (
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/30 inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  Spotify: {spotifyStatus.spotifyUser?.displayName || 'Connected'}
                </span>
              ) : spotifyStatus?.hasStoredCredentials && !spotifyStatus?.isConnected ? (
                <span className="text-xs font-semibold text-amber-400 bg-amber-950/40 px-3 py-1 rounded-full border border-amber-500/30 inline-flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Spotify: Restricted (403)
                </span>
              ) : (
                <button
                  onClick={() => connectSpotify('/profile')}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full border border-white/10 transition-colors inline-flex items-center gap-1.5"
                >
                  <Music2 className="w-3.5 h-3.5 text-emerald-400" />
                  Connect Spotify
                </button>
              )}
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
            <p className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
              {summary.duration.totalHours} <span className="text-xs font-normal text-slate-400">hrs</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">Across all synced sources</p>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Total Scrobbles</span>
              <Music2 className="w-4 h-4 text-brand-cyan" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
              {summary.duration.totalPlays.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 mt-1">Tracks completed</p>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Diversity Index</span>
              <Compass className="w-4 h-4 text-brand-violet" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-brand-violet mt-3">
              {summary.diversity.diversityScore}<span className="text-xs font-normal text-slate-400">/100</span>
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
                <div className="w-full bg-white/[0.05] h-2 rounded-full overflow-hidden">
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-dark-900 border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <h3 className="text-base font-bold text-white">Edit Profile</h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold mb-1 block">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-dark-950 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-emerald"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold mb-1 block">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Share your musical philosophy..."
                className="w-full bg-dark-950 border border-white/[0.08] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-emerald"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold mb-1 block">Avatar URL</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-dark-950 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-emerald"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold mb-1 block">Privacy Setting</label>
              <select
                value={privacySetting}
                onChange={(e) => setPrivacySetting(e.target.value as PrivacySetting)}
                className="w-full bg-dark-950 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-emerald"
              >
                <option value={PrivacySetting.PUBLIC}>Public Profile</option>
                <option value={PrivacySetting.FRIENDS_ONLY}>Friends Only</option>
                <option value={PrivacySetting.PRIVATE}>Private</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.06]">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSaving} icon={<Save className="w-3.5 h-3.5" />}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
