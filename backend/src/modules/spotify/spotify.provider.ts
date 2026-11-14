import { env } from '../../config/env.js';
import prisma from '../../db/prisma.js';

export interface SpotifyTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  scope?: string;
  tokenType?: string;
}

export interface SpotifyUserProfile {
  id: string;
  displayName: string;
  email?: string;
  imageUrl?: string;
  product?: string;
}

export interface SpotifyRecentlyPlayedItem {
  track: {
    id: string;
    name: string;
    duration_ms: number;
    explicit: boolean;
    preview_url: string | null;
    popularity?: number;
    artists: Array<{ id: string; name: string }>;
    album: {
      id: string;
      name: string;
      release_date?: string;
      total_tracks?: number;
      images: Array<{ url: string; height?: number; width?: number }>;
    };
  };
  played_at: string;
}

export interface SpotifyVerificationResult {
  verified: boolean;
  hasCredentials: boolean;
  status: number;
  profile?: SpotifyUserProfile;
  error?: string;
  details?: string;
}

export class SpotifyProvider {
  /**
   * Generates official Spotify OAuth Authorization URL
   */
  public getAuthorizationUrl(state: string): string {
    if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_REDIRECT_URI) {
      throw new Error('Spotify OAuth configuration missing. SPOTIFY_CLIENT_ID and SPOTIFY_REDIRECT_URI must be set.');
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: env.SPOTIFY_CLIENT_ID,
      scope: env.SPOTIFY_SCOPES,
      redirect_uri: env.SPOTIFY_REDIRECT_URI,
      state: state,
      show_dialog: 'true',
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  /**
   * Exchanges an authorization code for access and refresh tokens
   */
  public async exchangeCodeForTokens(code: string): Promise<SpotifyTokens> {
    if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET) {
      throw new Error('Spotify client credentials are not configured.');
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: env.SPOTIFY_REDIRECT_URI,
    });

    const authHeader = Buffer.from(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`).toString('base64');

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${authHeader}`,
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Spotify token exchange failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope,
      tokenType: data.token_type,
    };
  }

  /**
   * Refreshes an expired access token using the stored refresh token
   */
  public async refreshAccessToken(refreshToken: string): Promise<SpotifyTokens> {
    if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET) {
      throw new Error('Spotify client credentials are not configured.');
    }

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const authHeader = Buffer.from(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`).toString('base64');

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${authHeader}`,
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Spotify token refresh failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
      scope: data.scope,
    };
  }

  /**
   * Retrieves or refreshes a valid access token for the given user.
   * If allowUnverified is true, retrieves token even if isConnected is currently false (for verification purposes).
   */
  public async getValidAccessToken(userId: string, allowUnverified = false): Promise<string | null> {
    const connection = await prisma.providerConnection.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: 'spotify',
        },
      },
    });

    if (!connection || (!allowUnverified && !connection.isConnected) || !connection.accessToken) {
      return null;
    }

    const now = new Date();
    const tokenExp = connection.tokenExpiresAt ? new Date(connection.tokenExpiresAt) : new Date(0);

    // If token expires in less than 60 seconds, refresh it
    if (tokenExp.getTime() - now.getTime() < 60 * 1000) {
      if (!connection.refreshToken) {
        await prisma.providerConnection.update({
          where: { id: connection.id },
          data: { isConnected: false },
        });
        return null;
      }

      try {
        const refreshed = await this.refreshAccessToken(connection.refreshToken);
        const expiresAt = new Date(Date.now() + refreshed.expiresIn * 1000);

        await prisma.providerConnection.update({
          where: { id: connection.id },
          data: {
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken || connection.refreshToken,
            tokenExpiresAt: expiresAt,
          },
        });

        return refreshed.accessToken;
      } catch (err) {
        await prisma.providerConnection.update({
          where: { id: connection.id },
          data: { isConnected: false },
        });
        return null;
      }
    }

    return connection.accessToken;
  }

  /**
   * Fetches official user profile from /v1/me
   */
  public async getUserProfile(accessToken: string): Promise<SpotifyUserProfile> {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let parsedMessage = errorText;
      try {
        const json = JSON.parse(errorText);
        parsedMessage = json.error?.message || errorText;
      } catch {}
      const err: any = new Error(`Spotify API error (${response.status}): ${parsedMessage}`);
      err.status = response.status;
      err.rawResponse = errorText;
      throw err;
    }

    const data = await response.json();
    const imageUrl = data.images && data.images.length > 0 ? data.images[0].url : undefined;

    return {
      id: data.id,
      displayName: data.display_name || data.id,
      email: data.email,
      imageUrl,
      product: data.product,
    };
  }

  /**
   * Verifies the Spotify connection against the official Spotify API
   */
  public async verifyConnection(userId: string): Promise<SpotifyVerificationResult> {
    const connection = await prisma.providerConnection.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: 'spotify',
        },
      },
    });

    if (!connection || !connection.accessToken) {
      return {
        verified: false,
        hasCredentials: false,
        status: 404,
        error: 'No Spotify connection exists for this user.',
      };
    }

    const token = await this.getValidAccessToken(userId, true);
    if (!token) {
      return {
        verified: false,
        hasCredentials: true,
        status: 401,
        error: 'Stored Spotify tokens have expired or were revoked. Please reconnect your account.',
      };
    }

    try {
      const profile = await this.getUserProfile(token);

      // Successfully verified against Spotify Web API
      await prisma.providerConnection.update({
        where: { id: connection.id },
        data: {
          isConnected: true,
          providerUserId: profile.id,
        },
      });

      return {
        verified: true,
        hasCredentials: true,
        status: 200,
        profile,
      };
    } catch (err: any) {
      const status = err.status || 500;
      let details = err.message || 'Unknown Spotify API error';

      if (status === 403 && details.includes('Active premium subscription required')) {
        details = 'Active Spotify Premium subscription required for the owner of the Spotify Developer App. Under Spotify Developer Policy, applications in Development Mode require the creating account to have Spotify Premium.';
      }

      await prisma.providerConnection.update({
        where: { id: connection.id },
        data: { isConnected: false },
      });

      return {
        verified: false,
        hasCredentials: true,
        status,
        error: err.message,
        details,
      };
    }
  }

  /**
   * Fetches recently played tracks from /v1/me/player/recently-played
   */
  public async getRecentlyPlayed(
    accessToken: string,
    limit = 50
  ): Promise<SpotifyRecentlyPlayedItem[]> {
    const url = new URL('https://api.spotify.com/v1/me/player/recently-played');
    url.searchParams.set('limit', Math.min(limit, 50).toString());

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let parsedMessage = errorText;
      try {
        const json = JSON.parse(errorText);
        parsedMessage = json.error?.message || errorText;
      } catch {}
      const err: any = new Error(`Spotify API error (${response.status}): ${parsedMessage}`);
      err.status = response.status;
      err.rawResponse = errorText;
      throw err;
    }

    const data = await response.json();
    return data.items || [];
  }

  /**
   * Fetches currently playing track from /v1/me/player/currently-playing
   */
  public async getCurrentlyPlaying(accessToken: string): Promise<any | null> {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 204 || response.status === 404 || !response.ok) {
        return null;
      }

      const data = await response.json();
      if (!data || !data.item) return null;

      return {
        isPlaying: data.is_playing,
        progressMs: data.progress_ms,
        track: {
          id: data.item.id,
          name: data.item.name,
          durationMs: data.item.duration_ms,
          artistName: data.item.artists?.[0]?.name || 'Unknown Artist',
          albumName: data.item.album?.name,
          coverUrl: data.item.album?.images?.[0]?.url,
        },
      };
    } catch {
      return null;
    }
  }

  /**
   * Disconnects a user's Spotify account
   */
  public async disconnect(userId: string): Promise<void> {
    await prisma.providerConnection.deleteMany({
      where: {
        userId,
        provider: 'spotify',
      },
    });
  }
}

export const spotifyProvider = new SpotifyProvider();
