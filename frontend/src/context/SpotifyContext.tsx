import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../utils/api.js';
import { useAuth } from './AuthContext.js';

export interface SpotifyStatus {
  isConnected: boolean;
  verified: boolean;
  hasStoredCredentials?: boolean;
  hasClientCredentials?: boolean;
  providerUserId?: string | null;
  spotifyUser?: {
    id: string;
    displayName: string;
    email?: string;
    product?: string;
    imageUrl?: string;
  } | null;
  scope?: string | null;
  lastSyncedAt?: string | null;
  tokenExpiresAt?: string | null;
  apiStatus?: number | null;
  error?: string | null;
  details?: string | null;
}

interface SpotifyContextType {
  status: SpotifyStatus | null;
  isLoading: boolean;
  isSyncing: boolean;
  isVerifying: boolean;
  error: string | null;
  checkStatus: () => Promise<SpotifyStatus | null>;
  verifyConnection: () => Promise<SpotifyStatus | null>;
  connectSpotify: (returnTo?: any) => Promise<void>;
  disconnectSpotify: () => Promise<void>;
  syncSpotify: () => Promise<{ success: boolean; ingestedCount: number; message: string }>;
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

export const SpotifyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SpotifyStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    if (!user) {
      setStatus(null);
      setIsLoading(false);
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await apiFetch<SpotifyStatus>('/spotify/status');
      setStatus(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to check Spotify status');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyConnection = async () => {
    if (!user) return null;

    try {
      setIsVerifying(true);
      setError(null);
      const data = await apiFetch<SpotifyStatus>('/spotify/verify', { method: 'POST' });
      // Re-fetch full status
      const updated = await apiFetch<SpotifyStatus>('/spotify/status');
      setStatus(updated);
      return updated;
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      return null;
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [user]);

  const connectSpotify = async (returnTo?: any) => {
    try {
      setError(null);
      const target = typeof returnTo === 'string' && returnTo.startsWith('/') ? returnTo : '/profile';
      const data = await apiFetch<{ url: string }>(`/spotify/auth-url?returnTo=${encodeURIComponent(target)}`);
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate Spotify connection');
      throw err;
    }
  };

  const disconnectSpotify = async () => {
    try {
      setError(null);
      await apiFetch('/spotify/disconnect', { method: 'POST' });
      await checkStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect Spotify');
      throw err;
    }
  };

  const syncSpotify = async () => {
    try {
      setIsSyncing(true);
      setError(null);
      const data = await apiFetch<{ success: boolean; ingestedCount: number; message: string }>(
        '/spotify/sync',
        { method: 'POST' }
      );
      await checkStatus();
      return data;
    } catch (err: any) {
      setError(err.message || 'Sync with Spotify failed');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <SpotifyContext.Provider
      value={{
        status,
        isLoading,
        isSyncing,
        isVerifying,
        error,
        checkStatus,
        verifyConnection,
        connectSpotify,
        disconnectSpotify,
        syncSpotify,
      }}
    >
      {children}
    </SpotifyContext.Provider>
  );
};

export const useSpotify = () => {
  const context = useContext(SpotifyContext);
  if (!context) {
    throw new Error('useSpotify must be used within a SpotifyProvider');
  }
  return context;
};
