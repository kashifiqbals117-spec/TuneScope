import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Disc3,
  RefreshCw,
  Unlink,
  Check,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  Info,
  CheckCircle2,
  Lock,
  UserCheck,
} from 'lucide-react';
import { useSpotify } from '../context/SpotifyContext.js';
import { useAuth } from '../context/AuthContext.js';
import { GlassCard } from '../components/common/GlassCard.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { PrivacySetting } from '@tunescope/shared';

interface FeedbackState {
  type: 'success' | 'warning' | 'error';
  message: string;
}

export const Settings: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const {
    status,
    isLoading: isSpotifyLoading,
    isSyncing,
    isVerifying,
    error: spotifyError,
    connectSpotify,
    disconnectSpotify,
    syncSpotify,
    verifyConnection,
  } = useSpotify();

  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [disconnectFeedback, setDisconnectFeedback] = useState<string | null>(null);
  const [privacySetting, setPrivacySetting] = useState<PrivacySetting>(
    user?.privacySetting || PrivacySetting.PUBLIC
  );

  // Check URL params for OAuth callback return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const spotifyStatus = params.get('spotify');
    const message = params.get('message');

    if (spotifyStatus === 'connected') {
      setFeedback({
        type: 'success',
        message: 'Successfully linked and verified Spotify account!',
      });
    } else if (spotifyStatus === 'restricted') {
      setFeedback({
        type: 'warning',
        message: `Spotify OAuth authorized! Credentials stored, but Spotify Web API returned HTTP 403: ${
          message || 'Developer app owner requires an active Spotify Premium subscription.'
        }`,
      });
    } else if (spotifyStatus === 'error') {
      setFeedback({
        type: 'error',
        message: `Spotify authorization issue: ${message || 'Authentication was denied or timed out'}`,
      });
    }
  }, []);

  const handleSync = async () => {
    try {
      setFeedback(null);
      const res = await syncSpotify();
      setFeedback({
        type: 'success',
        message: `Successfully synced ${res.ingestedCount} new tracks from Spotify!`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Sync failed: ${err.message || 'Unable to sync with Spotify API'}`,
      });
    }
  };

  const handleVerify = async () => {
    try {
      setFeedback(null);
      const updated = await verifyConnection();
      if (updated?.verified) {
        setFeedback({
          type: 'success',
          message: 'Spotify connection successfully verified against official Web API!',
        });
      } else if (updated?.apiStatus === 403) {
        setFeedback({
          type: 'warning',
          message: `Verification check: Stored tokens are valid, but Spotify Web API returned HTTP 403 (${
            updated.details || 'Active premium subscription required for app owner'
          }).`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: updated?.error || 'Verification check failed',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Verification failed: ${err.message}`,
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      setDisconnectFeedback(null);
      await disconnectSpotify();
      setDisconnectFeedback('Spotify account has been unlinked and tokens removed from database.');
      setFeedback(null);
      setTimeout(() => setDisconnectFeedback(null), 4000);
    } catch (err: any) {
      setDisconnectFeedback(`Disconnect failed: ${err.message}`);
    }
  };

  const handlePrivacyChange = async (newSetting: PrivacySetting) => {
    setPrivacySetting(newSetting);
    await updateProfile({ privacySetting: newSetting });
  };

  const getStatusBadge = () => {
    if (status?.verified) {
      return (
        <Badge variant="emerald" size="sm">
          Verified & Connected
        </Badge>
      );
    }
    if (status?.hasStoredCredentials) {
      return (
        <Badge variant="amber" size="sm">
          OAuth Authorized (API Restricted)
        </Badge>
      );
    }
    return (
      <Badge variant="muted" size="sm">
        Not Connected
      </Badge>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage music provider integrations, privacy preferences, and demo modes.
        </p>
      </div>

      {/* Spotify Integration Section */}
      <GlassCard className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1DB954]/15 text-[#1DB954] flex items-center justify-center flex-shrink-0">
              <Disc3 className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Spotify Web API Integration</h3>
                {getStatusBadge()}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Official OAuth 2.0 connection. Securely sync recently played tracks.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {status?.verified ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={isSyncing}
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                  onClick={handleSync}
                >
                  Sync Now
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={isVerifying}
                  icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  onClick={handleVerify}
                >
                  Re-verify
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Unlink className="w-3.5 h-3.5" />}
                  onClick={handleDisconnect}
                >
                  Disconnect
                </Button>
              </>
            ) : status?.hasStoredCredentials ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={isVerifying}
                  icon={<RefreshCw className="w-3.5 h-3.5 text-amber-400" />}
                  onClick={handleVerify}
                >
                  Re-verify Access
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Unlink className="w-3.5 h-3.5" />}
                  onClick={handleDisconnect}
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                variant="spotify"
                size="md"
                onClick={connectSpotify}
                icon={<Disc3 className="w-4 h-4 fill-black" />}
              >
                Connect Spotify
              </Button>
            )}
          </div>
        </div>

        {/* Feedback messages */}
        {feedback && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
              feedback.type === 'error'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : feedback.type === 'warning'
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            {feedback.type === 'error' && <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />}
            {feedback.type === 'warning' && <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />}
            {feedback.type === 'success' && <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />}
            <span className="leading-relaxed">{feedback.message}</span>
          </div>
        )}

        {disconnectFeedback && (
          <p className="text-xs text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
            {disconnectFeedback}
          </p>
        )}

        {/* API Restriction Warning Box */}
        {status?.hasStoredCredentials && !status?.verified && (
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Spotify Developer Policy Notice: Developer Account Subscription Required (HTTP 403)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Your OAuth tokens were successfully authorized and stored in PostgreSQL. However, Spotify’s Developer Platform
              requires that the Spotify account owning the registered application (Spotify Client ID) maintains an active
              Spotify Premium subscription before requests to Web API endpoints (<code className="text-amber-300 font-mono">/v1/me</code> and <code className="text-amber-300 font-mono">/v1/me/player/recently-played</code>) are permitted.
            </p>
            {status?.details && (
              <div className="p-2.5 rounded-xl bg-black/40 border border-amber-500/20 font-mono text-[11px] text-amber-200">
                Spotify API Error: {status.details}
              </div>
            )}
            <p className="text-slate-400 text-[11px]">
              Once the developer app owner has an active subscription, click <strong>"Re-verify Access"</strong> above to begin syncing live scrobbles.
            </p>
          </div>
        )}

        {/* Verified Spotify Profile Card */}
        {status?.verified && status?.spotifyUser && (
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {status.spotifyUser.imageUrl ? (
                <img
                  src={status.spotifyUser.imageUrl}
                  alt={status.spotifyUser.displayName}
                  className="w-12 h-12 rounded-full object-cover border border-emerald-500/30"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                  {status.spotifyUser.displayName?.charAt(0).toUpperCase() || 'S'}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  {status.spotifyUser.displayName}
                </p>
                <p className="text-xs text-slate-400">
                  Spotify ID: <span className="font-mono text-slate-300">{status.spotifyUser.id}</span>
                  {status.spotifyUser.product && (
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-bold">
                      {status.spotifyUser.product}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              Active Connection
            </span>
          </div>
        )}

        {/* Stored Credentials & Telemetry Details */}
        <div className="p-4 rounded-2xl bg-dark-900/80 border border-white/5 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
            <span className="text-slate-400">Database Storage</span>
            <span className="font-mono text-white font-semibold flex items-center gap-1.5">
              {status?.hasStoredCredentials ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Persisted in PostgreSQL</span>
                </>
              ) : (
                <span className="text-slate-500">None</span>
              )}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
            <span className="text-slate-400">Spotify User ID</span>
            <span className="font-mono text-white font-semibold">
              {status?.providerUserId || status?.spotifyUser?.id || (status?.hasStoredCredentials ? 'Persisted' : 'None')}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
            <span className="text-slate-400">Last Telemetry Sync</span>
            <span className="text-slate-300">
              {status?.lastSyncedAt
                ? new Date(status.lastSyncedAt).toLocaleString()
                : 'Never synced'}
            </span>
          </div>

          {status?.tokenExpiresAt && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
              <span className="text-slate-400">Access Token Status</span>
              <span className="text-slate-300 font-mono">
                Active (Auto-refreshes before expiry)
              </span>
            </div>
          )}

          <div className="space-y-1.5 pt-1">
            <span className="text-slate-400 block font-semibold">Authorized Permissions (Scopes)</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'user-read-recently-played',
                'user-top-read',
                'user-read-playback-state',
                'user-read-currently-playing',
              ].map((scope) => (
                <span
                  key={scope}
                  className="px-2 py-0.5 rounded bg-white/5 text-[11px] font-mono text-slate-300 border border-white/5"
                >
                  {scope}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              TuneScope adheres to the official Spotify Developer Policy. Client Secret is never exposed to the frontend, access tokens are securely managed, and no prohibited derived metrics or profiles are generated from Spotify Content.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Privacy & Visibility Settings */}
      <GlassCard className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-brand-cyan">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Privacy & Visibility Controls</h3>
            <p className="text-xs text-slate-400">Manage who can inspect your listening history and profile</p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {[
            {
              id: PrivacySetting.PUBLIC,
              title: 'Public Profile',
              desc: 'Anyone on TuneScope can view your music persona, top genres, and recaps.',
            },
            {
              id: PrivacySetting.FRIENDS_ONLY,
              title: 'Friends Only',
              desc: 'Only accepted friends can see your live listening feed and taste compatibility.',
            },
            {
              id: PrivacySetting.PRIVATE,
              title: 'Private',
              desc: 'Hide your profile and listening activity from search results and feeds.',
            },
          ].map((option) => (
            <label
              key={option.id}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                privacySetting === option.id
                  ? 'bg-brand-emerald/10 border-brand-emerald/40 text-white'
                  : 'bg-dark-900/60 border-white/5 text-slate-400 hover:bg-white/[0.02]'
              }`}
            >
              <input
                type="radio"
                name="privacy"
                value={option.id}
                checked={privacySetting === option.id}
                onChange={() => handlePrivacyChange(option.id)}
                className="mt-1 text-brand-emerald focus:ring-brand-emerald"
              />
              <div className="text-xs">
                <p className="font-bold text-white">{option.title}</p>
                <p className="text-slate-400 mt-0.5">{option.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </GlassCard>

      {/* Demo Mode & Developer Dataset */}
      <GlassCard className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-brand-violet">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Demonstration & Sample Datasets</h3>
            <p className="text-xs text-slate-400">Sample data controls for testing and showcasing</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          TuneScope includes pre-generated high-fidelity demonstration datasets (Alex Mercer, Sarah Chen, Marcus Vance, Elena Rostova) complete with 150+ scrobbles, audio features, Wrapped stories, and social reactions.
        </p>

        <div className="p-3.5 rounded-2xl bg-dark-900 border border-white/5 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-white">Demo Data Mode</span>
            <p className="text-slate-400 text-[11px]">Active when viewing simulated catalogs</p>
          </div>
          <Badge variant="violet" size="sm">
            Enabled
          </Badge>
        </div>
      </GlassCard>
    </div>
  );
};
