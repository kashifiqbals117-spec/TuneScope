import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createServer } from '../src/server.js';
import { spotifyProvider } from '../src/modules/spotify/spotify.provider.js';
import { env } from '../src/config/env.js';

const app = createServer();

describe('Spotify Provider & Routes', () => {
  let authToken = '';

  it('should authenticate user for spotify tests', async () => {
    const res = await request(app).post('/api/auth/demo-login');
    expect(res.status).toBe(200);
    authToken = res.body.token;
  });

  it('should generate official Spotify OAuth authorization URL with configured 127.0.0.1 redirect URI', async () => {
    const state = 'test-state-123';
    const url = spotifyProvider.getAuthorizationUrl(state);

    expect(url).toContain('https://accounts.spotify.com/authorize');
    expect(url).toContain('response_type=code');
    expect(url).toContain('client_id=');
    expect(url).toContain('state=test-state-123');
    
    // Explicitly verify redirect_uri uses 127.0.0.1 and not localhost
    expect(url).toContain(`redirect_uri=${encodeURIComponent('http://127.0.0.1:5000/api/spotify/callback')}`);
    expect(url).not.toContain('redirect_uri=http%3A%2F%2Flocalhost');
  });

  it('should return 401 when requesting spotify auth URL without bearer token', async () => {
    const res = await request(app).get('/api/spotify/auth-url');
    expect(res.status).toBe(401);
  });

  it('should return auth URL for authenticated user with 127.0.0.1 redirect URI', async () => {
    const res = await request(app)
      .get('/api/spotify/auth-url')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('url');
    expect(res.body.url).toContain('accounts.spotify.com');
    expect(res.body.url).toContain(encodeURIComponent('http://127.0.0.1:5000/api/spotify/callback'));
  });

  it('should verify token exchange request uses the exact same configured 127.0.0.1 redirect URI', async () => {
    const mockCode = 'spotify-test-auth-code-xyz';
    let capturedUrl = '';
    let capturedBody = '';
    let capturedHeaders: Record<string, string> = {};

    // Mock global fetch to inspect token exchange request payload
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation(async (url: string | URL, init?: RequestInit) => {
      capturedUrl = url.toString();
      capturedBody = init?.body ? init.body.toString() : '';
      capturedHeaders = (init?.headers as Record<string, string>) || {};

      return {
        ok: true,
        json: async () => ({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          scope: env.SPOTIFY_SCOPES,
          token_type: 'Bearer',
        }),
      } as Response;
    });

    try {
      const tokens = await spotifyProvider.exchangeCodeForTokens(mockCode);
      
      expect(capturedUrl).toBe('https://accounts.spotify.com/api/token');
      expect(tokens.accessToken).toBe('mock-access-token');
      expect(tokens.refreshToken).toBe('mock-refresh-token');

      // Verify the POST body parameters sent to Spotify
      const bodyParams = new URLSearchParams(capturedBody);
      expect(bodyParams.get('grant_type')).toBe('authorization_code');
      expect(bodyParams.get('code')).toBe(mockCode);
      expect(bodyParams.get('redirect_uri')).toBe('http://127.0.0.1:5000/api/spotify/callback');
      expect(bodyParams.get('redirect_uri')).not.toContain('localhost');

      // Verify authorization header includes Basic credentials
      expect(capturedHeaders['Authorization']).toBeDefined();
      expect(capturedHeaders['Authorization']).toContain('Basic ');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should return connection status indicating current state', async () => {
    const res = await request(app)
      .get('/api/spotify/status')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('hasClientCredentials');
    expect(res.body).toHaveProperty('isConnected');
  });

  it('should handle callback errors gracefully with redirect and preserve 127.0.0.1 host', async () => {
    const res = await request(app)
      .get('/api/spotify/callback?error=access_denied')
      .set('Host', '127.0.0.1:5000');

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('127.0.0.1:5173/profile');
    expect(res.headers.location).toContain('spotify=error');
    expect(res.headers.location).toContain('access_denied');
  });

  it('should reject callback with invalid or tampered state', async () => {
    const res = await request(app)
      .get('/api/spotify/callback?code=mock_code&state=invalid-tampered-state')
      .set('Host', '127.0.0.1:5000');

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('spotify=error');
    expect(res.headers.location).toContain('Invalid');
  });

  it('should return 401 on /profile when user is not connected to spotify', async () => {
    const res = await request(app)
      .get('/api/spotify/profile')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('No valid Spotify credentials found');
  });

  it('should verify connection on /verify and return verified: false when not connected', async () => {
    const res = await request(app)
      .post('/api/spotify/verify')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.verified).toBe(false);
    expect(res.body.hasCredentials).toBe(false);
  });

  it('should handle Spotify 403 developer premium requirement gracefully in getUserProfile', async () => {
    const originalFetch = globalThis.fetch;
    const errorPayload = {
      error: {
        status: 403,
        message:
          'Active premium subscription required for the owner of the app. When the subscription status changes, it can take a few hours before requests are allowed again.',
      },
    };

    globalThis.fetch = vi.fn().mockImplementation(async () => {
      return {
        ok: false,
        status: 403,
        text: async () => JSON.stringify(errorPayload),
        json: async () => errorPayload,
      } as Response;
    });

    try {
      await expect(spotifyProvider.getUserProfile('test-token')).rejects.toThrow(
        'Active premium subscription required'
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should successfully parse profile when Spotify returns 200 OK', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          id: 'spotify-user-123',
          display_name: 'Test Spotify User',
          email: 'test@spotify.com',
          product: 'premium',
          images: [{ url: 'https://example.com/avatar.jpg' }],
        }),
      } as Response;
    });

    try {
      const profile = await spotifyProvider.getUserProfile('valid-test-token');
      expect(profile.id).toBe('spotify-user-123');
      expect(profile.displayName).toBe('Test Spotify User');
      expect(profile.product).toBe('premium');
      expect(profile.imageUrl).toBe('https://example.com/avatar.jpg');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should handle disconnect cleanly', async () => {
    const res = await request(app)
      .post('/api/spotify/disconnect')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
