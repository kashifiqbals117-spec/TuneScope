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
  User,
  Bell,
  Sliders,
  Volume2,
  Save,
} from 'lucide-react';
import { useSpotify } from '../context/SpotifyContext.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { GlassCard } from '../components/common/GlassCard.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { PrivacySetting } from '@tunescope/shared';

interface FeedbackState {
  type: 'success' | 'warning' | 'error';
  message: string;
}

type SettingsSection = 'account' | 'services' | 'privacy' | 'notifications' | 'preferences';

export const Settings: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const {
    status,
    isLoading: isSpotifyLoading,
    isSyncing,
    isVerifying,
    connectSpotify,
    disconnectSpotify,
    syncSpotify,
    verifyConnection,
  } = useSpotify();

  const [activeTab, setActiveTab] = useState<SettingsSection>('services');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [disconnectFeedback, setDisconnectFeedback] = useState<string | null>(null);

  // Account form
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  // Privacy setting
  const [privacySetting, setPrivacySetting] = useState<PrivacySetting>(
    user?.privacySetting || PrivacySetting.PUBLIC
  );

  // Notifications
  const [notifWeeklyRecap, setNotifWeeklyRecap] = useState(true);
  const [notifFriendActivity, setNotifFriendActivity] = useState(true);
  const [notifProductUpdates, setNotifProductUpdates] = useState(false);

  // Preferences
  const [autoPlayPreview, setAutoPlayPreview] = useState(true);
  const [demoDataEnabled, setDemoDataEnabled] = useState(true);

  // Check URL params for OAuth callback return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const spotifyStatus = params.get('spotify');
    const message = params.get('message');

    if (spotifyStatus) {
      setActiveTab('services');
    }

    if (spotifyStatus === 'connected') {
      setFeedback({
        type: 'success',
        message: 'Successfully linked and verified Spotify account!',
      });
      toast.success('Spotify account linked and verified!');
    } else if (spotifyStatus === 'restricted') {
      setFeedback({
        type: 'warning',
        message: `Spotify OAuth authorized! Credentials stored, but Spotify Web API returned HTTP 403: ${
          message || 'Developer app owner requires an active Spotify Premium subscription.'
        }`,
      });
      toast.warning('Spotify authorized, but API requires app owner Premium subscription');
    } else if (spotifyStatus === 'error') {
      setFeedback({
        type: 'error',
        message: `Spotify authorization issue: ${message || 'Authentication was denied or timed out'}`,
      });
      toast.error('Spotify authorization was denied or cancelled');
    }
  }, []);

  const handleSync = async () => {
    try {
      setFeedback(null);
      const res = await syncSpotify();
      toast.success(`Successfully synced ${res.ingestedCount} tracks from Spotify!`);
      setFeedback({
        type: 'success',
        message: `Successfully synced ${res.ingestedCount} new tracks from Spotify!`,
      });
    } catch (err: any) {
      toast.error(err.message || 'Unable to sync with Spotify API');
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
        toast.success('Spotify Web API connection verified!');
        setFeedback({
          type: 'success',
          message: 'Spotify connection successfully verified against official Web API!',
        });
      } else if (updated?.apiStatus === 403) {
        toast.warning('Spotify API returned 403: App owner Premium subscription required');
        setFeedback({
          type: 'warning',
          message: `Verification check: Stored tokens are valid, but Spotify Web API returned HTTP 403 (${
            updated.details || 'Active premium subscription required for app owner'
          }).`,
        });
      } else {
        toast.error(updated?.error || 'Verification check failed');
        setFeedback({
          type: 'error',
          message: updated?.error || 'Verification check failed',
        });
      }
    } catch (err: any) {
      toast.error(`Verification failed: ${err.message}`);
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
      toast.info('Spotify account unlinked');
      setDisconnectFeedback('Spotify account has been unlinked and tokens removed from database.');
      setFeedback(null);
      setTimeout(() => setDisconnectFeedback(null), 4000);
    } catch (err: any) {
      toast.error(`Disconnect failed: ${err.message}`);
      setDisconnectFeedback(`Disconnect failed: ${err.message}`);
    }
  };

  const handlePrivacyChange = async (newSetting: PrivacySetting) => {
    setPrivacySetting(newSetting);
    await updateProfile({ privacySetting: newSetting });
    toast.success(`Privacy mode updated to ${newSetting.toLowerCase()}`);
  };

  const handleSaveAccount = async () => {
    try {
      setIsSavingAccount(true);
      await updateProfile({ displayName });
      toast.success('Account profile updated successfully');
    } catch (err: any) {
      toast.error('Failed to update account details');
    } finally {
      setIsSavingAccount(false);
    }
  };

  const getStatusBadge = () => {
    if (status?.verified) {
      return (
        <Badge variant="emerald" size="sm">
          Verified & Active
        </Badge>
      );
    }
    if (status?.hasStoredCredentials) {
      return (
        <Badge variant="amber" size="sm">
          Authorized (API Restricted - HTTP 403)
        </Badge>
      );
    }
    return (
      <Badge variant="muted" size="sm">
        Not Connected
      </Badge>
    );
  };

  const tabs = [
    { id: 'account' as const, label: 'Account', icon: User },
    { id: 'services' as const, label: 'Connected Services', icon: Disc3 },
    { id: 'privacy' as const, label: 'Privacy', icon: Shield },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'preferences' as const, label: 'Preferences', icon: Sliders },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Settings</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your TuneScope account profile, music service integrations, privacy rules, and app preferences.
        </p>
      </div>

      {/* Grouped Settings Tabs */}
      <div className="flex border-b border-white/[0.08] space-x-2 sm:space-x-6 text-xs sm:text-sm font-semibold text-slate-400 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 whitespace-nowrap transition-colors relative ${
                isActive
                  ? 'text-brand-emerald border-b-2 border-brand-emerald'
                  : 'hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: ACCOUNT */}
      {activeTab === 'account' && (
        <GlassCard className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-emerald/10 text-brand-emerald">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Account Profile</h3>
              <p className="text-xs text-slate-400">Personal details and identification on TuneScope</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-dark-950/60 border border-white/[0.04]">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
              alt={user?.displayName}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/10"
            />
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">{user?.displayName || 'TuneScope Listener'}</p>
              <p className="text-xs text-slate-400">@{user?.username || 'user'}</p>
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-brand-emerald bg-emerald-500/10 px-2 py-0.5 rounded-md">
                Persona: {user?.persona || 'Cosmic Explorer'}
              </span>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-slate-300 font-semibold mb-1 block">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-dark-950 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-emerald"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1 block">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-dark-950/50 border border-white/[0.05] rounded-xl px-3.5 py-2.5 text-xs text-slate-500 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Email address is locked for account security.
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                icon={<Save className="w-3.5 h-3.5" />}
                isLoading={isSavingAccount}
                onClick={handleSaveAccount}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* SECTION 2: CONNECTED SERVICES (SPOTIFY) */}
      {activeTab === 'services' && (
        <GlassCard className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1DB954]/15 text-[#1DB954] flex items-center justify-center flex-shrink-0">
                <Disc3 className="w-6 h-6 animate-spin-slow" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white">Spotify Web API Integration</h3>
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
          <div className="p-4 rounded-2xl bg-dark-950/60 border border-white/[0.06] space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.04] pb-3">
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

            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.04] pb-3">
              <span className="text-slate-400">Spotify User ID</span>
              <span className="font-mono text-white font-semibold">
                {status?.providerUserId || status?.spotifyUser?.id || (status?.hasStoredCredentials ? 'Persisted' : 'None')}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.04] pb-3">
              <span className="text-slate-400">Last Telemetry Sync</span>
              <span className="text-slate-300">
                {status?.lastSyncedAt
                  ? new Date(status.lastSyncedAt).toLocaleString()
                  : 'Never synced'}
              </span>
            </div>

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
                TuneScope adheres strictly to the official Spotify Developer Policy. Client Secret is never exposed to the frontend, access tokens are securely managed, and no prohibited derived metrics are generated.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* SECTION 3: PRIVACY */}
      {activeTab === 'privacy' && (
        <GlassCard className="space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-brand-cyan">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Privacy & Visibility Controls</h3>
              <p className="text-xs text-slate-400">Manage who can view your listening activity and taste profile</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {[
              {
                id: PrivacySetting.PUBLIC,
                title: 'Public Profile',
                desc: 'Anyone on TuneScope can discover your music persona, top genres, and yearly recaps.',
              },
              {
                id: PrivacySetting.FRIENDS_ONLY,
                title: 'Friends Only',
                desc: 'Only accepted friends can see your live listening feed and taste compatibility scores.',
              },
              {
                id: PrivacySetting.PRIVATE,
                title: 'Private',
                desc: 'Hide your profile and listening activity completely from search results and feeds.',
              },
            ].map((option) => (
              <label
                key={option.id}
                className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                  privacySetting === option.id
                    ? 'bg-brand-emerald/10 border-brand-emerald/40 text-white'
                    : 'bg-dark-950/60 border-white/[0.05] text-slate-400 hover:bg-white/[0.02]'
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
                  <p className="text-slate-400 mt-0.5 leading-relaxed">{option.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </GlassCard>
      )}

      {/* SECTION 4: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <GlassCard className="space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-brand-violet">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Notification Preferences</h3>
              <p className="text-xs text-slate-400">Choose when TuneScope alerts you about music events</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {[
              {
                title: 'Weekly Recap Alerts',
                desc: 'Get notified as soon as your weekly listening milestones and recap stories are compiled.',
                checked: notifWeeklyRecap,
                toggle: () => setNotifWeeklyRecap(!notifWeeklyRecap),
              },
              {
                title: 'Friend Music Activity & Reactions',
                desc: 'Receive alerts when friends react to songs you shared or discover mutual anthems.',
                checked: notifFriendActivity,
                toggle: () => setNotifFriendActivity(!notifFriendActivity),
              },
              {
                title: 'Product Announcements & Yearly Wrapped',
                desc: 'Be the first to explore seasonal Wrapped editions and new music intelligence features.',
                checked: notifProductUpdates,
                toggle: () => setNotifProductUpdates(!notifProductUpdates),
              },
            ].map((n, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-2xl bg-dark-950/60 border border-white/[0.05]"
              >
                <div className="max-w-md">
                  <p className="text-xs font-bold text-white">{n.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{n.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={n.toggle}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    n.checked ? 'bg-brand-emerald' : 'bg-dark-800'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      n.checked ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* SECTION 5: APPLICATION PREFERENCES */}
      {activeTab === 'preferences' && (
        <GlassCard className="space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-brand-cyan">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Application Preferences</h3>
              <p className="text-xs text-slate-400">Audio playback, sample data, and display configurations</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-dark-950/60 border border-white/[0.05]">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-brand-cyan" />
                  Auto-Play Sound Previews
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Automatically start 30-second audio clips when clicking anthems in library views.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAutoPlayPreview(!autoPlayPreview)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  autoPlayPreview ? 'bg-brand-emerald' : 'bg-dark-800'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    autoPlayPreview ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-dark-950/60 border border-white/[0.05]">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-brand-violet" />
                  Demonstration Dataset Mode
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pre-load realistic simulated scrobbles and Wrapped stories when no live provider telemetry is synced.
                </p>
              </div>
              <Badge variant="violet" size="sm">
                Active
              </Badge>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
