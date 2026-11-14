import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createServer } from '../src/server.js';
import prisma from '../src/db/prisma.js';

const app = createServer();

describe('Analytics Engine Tests', () => {
  let authToken = '';
  let alexId = '';
  let sarahId = '';

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/demo-login');
    authToken = res.body.token;
    alexId = res.body.user.id;

    const sarah = await prisma.user.findUnique({
      where: { email: 'sarah@tunescope.app' },
    });
    if (sarah) sarahId = sarah.id;
  });

  it('should calculate comprehensive analytics summary', async () => {
    const res = await request(app)
      .get('/api/analytics/summary?period=all')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('duration');
    expect(res.body.duration.totalMinutes).toBeGreaterThan(0);
    expect(res.body.duration.totalPlays).toBeGreaterThan(0);

    expect(res.body).toHaveProperty('topArtists');
    expect(res.body.topArtists.length).toBeGreaterThan(0);

    expect(res.body).toHaveProperty('diversity');
    expect(res.body.diversity.diversityScore).toBeGreaterThanOrEqual(0);
    expect(res.body.diversity.diversityScore).toBeLessThanOrEqual(100);

    expect(res.body).toHaveProperty('loyalty');
    expect(res.body.loyalty.loyaltyScore).toBeGreaterThanOrEqual(0);

    expect(res.body).toHaveProperty('persona');
    expect(res.body.persona).toHaveProperty('title');
    expect(res.body.persona).toHaveProperty('badge');
  });

  it('should return top artists ranking', async () => {
    const res = await request(app)
      .get('/api/analytics/artists?limit=5')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.artists.length).toBeLessThanOrEqual(5);
    expect(res.body.artists[0].rank).toBe(1);
    expect(res.body.artists[0].playCount).toBeGreaterThanOrEqual(res.body.artists[1]?.playCount || 0);
  });

  it('should return discovery patterns and velocity', async () => {
    const res = await request(app)
      .get('/api/analytics/discovery')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('newArtistsDiscovered');
    expect(res.body).toHaveProperty('discoveryVelocity');
    expect(res.body).toHaveProperty('timeline');
  });

  it('should calculate taste comparison between two users', async () => {
    if (!sarahId) return;

    const res = await request(app)
      .get(`/api/social/compare/${sarahId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('overlapPercentage');
    expect(res.body.overlapPercentage).toBeGreaterThanOrEqual(0);
    expect(res.body.overlapPercentage).toBeLessThanOrEqual(100);
    expect(res.body).toHaveProperty('vibeDescription');
  });
});

