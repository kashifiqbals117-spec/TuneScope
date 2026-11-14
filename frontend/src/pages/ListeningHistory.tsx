import React, { useEffect, useState, useMemo } from 'react';
import {
  History,
  Search,
  UploadCloud,
  Disc3,
  Calendar,
  Clock,
  Check,
  AlertCircle,
  RefreshCw,
  Settings as SettingsIcon,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api.js';
import { useSpotify } from '../context/SpotifyContext.js';
import { useToast } from '../context/ToastContext.js';
import { GlassCard } from '../components/common/GlassCard.js';
import { Badge } from '../components/common/Badge.js';
import { Button } from '../components/common/Button.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { TrackRowSkeleton } from '../components/common/Skeleton.js';
import { ErrorMessage } from '../components/common/ErrorMessage.js';

interface HistoryEvent {
  id: string;
  playedAt: string;
  durationMs: number;
  completionRate: number;
  source: string;
  deviceType?: string;
  track: {
    id: string;
    title: string;
    artistName: string;
    albumTitle?: string;
    coverUrl?: string;
    durationMs: number;
  };
}

export const ListeningHistory: React.FC = () => {
  const { status } = useSpotify();
  const toast = useToast();

  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const loadHistory = async (targetPage = 1, searchQuery = '', source = 'all') => {
    try {
      setIsLoading(true);
      setError(null);
      const queryParams = new URLSearchParams({
        page: targetPage.toString(),
        limit: '20',
      });
      if (searchQuery.trim()) queryParams.set('search', searchQuery.trim());
      if (source !== 'all') queryParams.set('source', source);

      const data = await apiFetch<{
        events: HistoryEvent[];
        pagination: { page: number; totalPages: number; totalCount?: number };
      }>(`/music/history?${queryParams.toString()}`);

      setEvents(data.events || []);
      setPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages || 1);
      if (data.pagination.totalCount !== undefined) {
        setTotalCount(data.pagination.totalCount);
      }
    } catch (err: any) {
      console.error('Failed to load history:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(1, search, sourceFilter);
  }, [search, sourceFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      loadHistory(newPage, search, sourceFilter);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleImport = async () => {
    try {
      setIsImporting(true);
      setImportStatus(null);
      let parsed = JSON.parse(importJson);
      if (!Array.isArray(parsed)) {
        parsed = [parsed];
      }

      const res = await apiFetch('/music/ingest', {
        method: 'POST',
        body: JSON.stringify({ records: parsed }),
      });

      const count = res.result?.newEventsCreated || parsed.length;
      toast.success(`Ingested ${count} scrobbles successfully!`);
      setImportStatus(`Success! Ingested ${count} scrobbles.`);
      setTimeout(() => {
        setShowImportModal(false);
        setImportJson('');
        setImportStatus(null);
        loadHistory(1, '', sourceFilter);
      }, 1200);
    } catch (err: any) {
      setImportStatus(`Import Error: ${err.message || 'Invalid JSON format'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const sampleJson = JSON.stringify(
    [
      {
        trackTitle: 'Midnight City',
        artistName: 'M83',
        albumTitle: 'Hurry Up, We’re Dreaming',
        playedAt: new Date().toISOString(),
        durationMs: 243000,
        genres: ['Electronic', 'Shoegaze'],
      },
      {
        trackTitle: 'Starboy',
        artistName: 'The Weeknd',
        albumTitle: 'Starboy',
        playedAt: new Date(Date.now() - 3600000).toISOString(),
        durationMs: 230000,
        genres: ['R&B', 'Pop'],
      },
    ],
    null,
    2
  );

  const formatDuration = (ms: number) => {
    if (!ms || ms <= 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderSourceBadge = (source: string) => {
    const s = (source || '').toLowerCase();
    if (s === 'spotify') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
          <Disc3 className="w-2.5 h-2.5 text-emerald-400" />
          Spotify
        </span>
      );
    }
    if (s === 'import' || s === 'imported') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20">
          <UploadCloud className="w-2.5 h-2.5 text-purple-400" />
          Import
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
        <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
        Demo
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Listening History
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Chronological audit log of all permitted listening telemetry and imported scrobbles.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          icon={<UploadCloud className="w-4 h-4 text-brand-emerald" />}
          onClick={() => {
            setImportJson(sampleJson);
            setShowImportModal(true);
          }}
        >
          Import Records
        </Button>
      </div>

      {/* Search and Source Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search scrobbles by song title or artist..."
            className="w-full bg-dark-900 border border-white/[0.08] rounded-2xl pl-11 pr-10 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-emerald/50 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Source Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-dark-900 border border-white/[0.08] overflow-x-auto">
          {[
            { id: 'all', label: 'All Sources' },
            { id: 'spotify', label: 'Spotify' },
            { id: 'import', label: 'Imported' },
            { id: 'demo', label: 'Demo' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSourceFilter(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                sourceFilter === tab.id
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorMessage error={error} onRetry={() => loadHistory(page, search, sourceFilter)} />}

      {/* History Table */}
      <GlassCard className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-white/5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <TrackRowSkeleton key={i} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 px-4">
            {search ? (
              <EmptyState
                icon={Search}
                title="No matching scrobbles found"
                description={`No tracks or artists matched "${search}". Try adjusting your query or resetting filters.`}
                actionText="Clear Search"
                onAction={() => setSearch('')}
              />
            ) : status?.verified ? (
              <EmptyState
                icon={Disc3}
                title="No scrobbles recorded yet"
                description="Your Spotify account is connected! Visit Settings and click 'Sync Now' to pull recently played tracks, or import records below."
                actionText="Go to Settings"
                onAction={() => (window.location.href = '/settings')}
                actionIcon={<SettingsIcon className="w-3.5 h-3.5" />}
                secondaryText="Import Sample Records"
                onSecondaryAction={() => {
                  setImportJson(sampleJson);
                  setShowImportModal(true);
                }}
              />
            ) : status?.hasStoredCredentials ? (
              <EmptyState
                icon={AlertCircle}
                title="Spotify Authorized (API Restricted)"
                description="OAuth credentials are saved, but Spotify requires active Spotify Premium on the developer app owner to call /v1/me and recently-played. You can import sample records to preview your analytics."
                actionText="Manage Connection"
                onAction={() => (window.location.href = '/settings')}
                secondaryText="Import Sample Records"
                onSecondaryAction={() => {
                  setImportJson(sampleJson);
                  setShowImportModal(true);
                }}
              />
            ) : (
              <EmptyState
                icon={History}
                title="No listening events recorded"
                description="Connect your Spotify account in Settings or use 'Import Records' to ingest listening history."
                actionText="Connect Spotify"
                onAction={() => (window.location.href = '/settings')}
                secondaryText="Import Sample Records"
                onSecondaryAction={() => {
                  setImportJson(sampleJson);
                  setShowImportModal(true);
                }}
              />
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={
                      event.track.coverUrl ||
                      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100'
                    }
                    alt={event.track.title}
                    className="w-11 h-11 rounded-xl object-cover flex-shrink-0 ring-1 ring-white/5"
                  />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-white truncate">
                      {event.track.title}
                    </p>
                    <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                      {event.track.artistName}
                      {event.track.albumTitle ? ` · ${event.track.albumTitle}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 text-right">
                  {renderSourceBadge(event.source)}

                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-medium text-slate-300">
                      {new Date(event.playedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {new Date(event.playedAt).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <span className="text-xs font-mono text-slate-400 min-w-[38px] text-right">
                    {formatDuration(event.durationMs || event.track.durationMs)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        {!isLoading && events.length > 0 && totalPages > 1 && (
          <div className="p-4 border-t border-white/[0.06] bg-dark-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-400">
              Page <strong className="text-white">{page}</strong> of{' '}
              <strong className="text-white">{totalPages}</strong>
              {totalCount ? ` (${totalCount} total scrobbles)` : ''}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-xl bg-dark-800 text-slate-300 border border-white/10 hover:bg-dark-700 disabled:opacity-40 disabled:pointer-events-none transition flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-xl bg-dark-800 text-slate-300 border border-white/10 hover:bg-dark-700 disabled:opacity-40 disabled:pointer-events-none transition flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-lg w-full rounded-2xl bg-dark-900 border border-white/10 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2 text-brand-emerald">
                <UploadCloud className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Import Scrobbles</h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Paste JSON formatted listening events conforming to the TuneScope ingestion schema.
            </p>

            <textarea
              rows={8}
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder="Paste JSON array here..."
              className="w-full bg-dark-950 font-mono text-xs text-slate-200 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-brand-emerald"
            />

            {importStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  importStatus.includes('Error')
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {importStatus.includes('Error') ? (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <Check className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{importStatus}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImportModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isImporting}
                onClick={handleImport}
              >
                Ingest Records
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
