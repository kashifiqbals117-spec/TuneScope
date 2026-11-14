import React, { useEffect, useState } from 'react';
import { History, Search, UploadCloud, Disc3, Calendar, Clock, Check, AlertCircle, RefreshCw, Settings as SettingsIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api.js';
import { useSpotify } from '../context/SpotifyContext.js';
import { GlassCard } from '../components/common/GlassCard.js';
import { Badge } from '../components/common/Badge.js';
import { Button } from '../components/common/Button.js';

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
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const loadHistory = async (targetPage = 1, searchQuery = '') => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page: targetPage.toString(),
        limit: '20',
      });
      if (searchQuery) queryParams.set('search', searchQuery);

      const data = await apiFetch<{
        events: HistoryEvent[];
        pagination: { page: number; totalPages: number };
      }>(`/music/history?${queryParams.toString()}`);

      setEvents(data.events);
      setPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(1, search);
  }, [search]);

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

      setImportStatus(`Success! Ingested ${res.result.newEventsCreated} scrobbles.`);
      setTimeout(() => {
        setShowImportModal(false);
        setImportJson('');
        setImportStatus(null);
        loadHistory(1, '');
      }, 1500);
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
    ],
    null,
    2
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Listening History</h1>
          <p className="text-sm text-slate-400 mt-1">
            Complete chronological ledger of all your scrobbles and streaming events.
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

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by track title or artist..."
          className="w-full bg-dark-900 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-emerald/50 transition"
        />
      </div>

      {/* History Table */}
      <GlassCard className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center">
            <Disc3 className="w-8 h-8 text-brand-emerald animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading scrobbles...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="py-20 px-4 text-center text-slate-400 max-w-md mx-auto space-y-3">
            <History className="w-10 h-10 mx-auto text-slate-600" />
            <div>
              <p className="text-sm font-bold text-white">
                {search ? 'No matching scrobbles' : 'No listening records yet'}
              </p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {search
                  ? `No events matched "${search}". Try searching for another artist or track.`
                  : status?.verified
                  ? 'Your Spotify account is connected! Visit Settings and click "Sync Now" to fetch your recently played tracks.'
                  : status?.hasStoredCredentials
                  ? 'Spotify OAuth authorized, but Web API requests currently require an active Spotify Premium subscription on the app owner. You can also import sample records to preview analytics.'
                  : 'Connect your Spotify account in Settings or click "Import Records" above to load listening history.'}
              </p>
            </div>
            {!search && (
              <div className="pt-2 flex justify-center gap-3">
                <Link
                  to="/settings"
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/10 flex items-center gap-1.5 transition"
                >
                  <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
                  Manage Settings
                </Link>
                <button
                  onClick={() => {
                    setImportJson(sampleJson);
                    setShowImportModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-brand-emerald/10 hover:bg-brand-emerald/20 text-xs font-semibold text-brand-emerald border border-brand-emerald/20 flex items-center gap-1.5 transition"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Import Sample
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={
                      event.track.coverUrl ||
                      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100'
                    }
                    alt={event.track.title}
                    className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{event.track.title}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {event.track.artistName} {event.track.albumTitle ? `· ${event.track.albumTitle}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0 text-right">
                  <Badge
                    variant={event.source === 'spotify' ? 'emerald' : 'violet'}
                    size="sm"
                  >
                    {event.source}
                  </Badge>

                  <div className="text-xs text-slate-400 hidden sm:block">
                    <p className="font-medium text-slate-300">
                      {new Date(event.playedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(event.playedAt).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => loadHistory(page - 1, search)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => loadHistory(page + 1, search)}
            >
              Next
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Import Permitted Listening Records</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Paste a JSON array of listening records. Raw telemetry is securely ingested and separated from derived analytics in compliance with data policies.
            </p>

            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              rows={8}
              className="w-full bg-dark-950 border border-white/10 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-brand-emerald"
            />

            {importStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  importStatus.includes('Error')
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {importStatus.includes('Error') ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                <span>{importStatus}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowImportModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" isLoading={isImporting} onClick={handleImport}>
                Ingest Records
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

