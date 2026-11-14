import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createServer } from '../src/server.js';

const app = createServer();

describe('Data Ingestion Pipeline', () => {
  let authToken = '';

  it('should authenticate user for ingestion test', async () => {
    const res = await request(app).post('/api/auth/demo-login');
    authToken = res.body.token;
  });

  it('should ingest a batch of external listening records', async () => {
    const batch = [
      {
        trackTitle: 'Midnight City',
        artistName: 'M83',
        albumTitle: 'Hurry Up, We’re Dreaming',
        playedAt: new Date().toISOString(),
        durationMs: 243000,
        genres: ['Shoegaze', 'Synthpop', 'Dream Pop'],
        coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300',
      },
      {
        trackTitle: 'Starboy',
        artistName: 'The Weeknd',
        albumTitle: 'Starboy',
        playedAt: new Date(Date.now() - 3600000).toISOString(),
        durationMs: 230000,
        genres: ['R&B', 'Pop'],
      },
    ];

    const res = await request(app)
      .post('/api/music/ingest')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ records: batch });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.result.newEventsCreated).toBe(2);
  });

  it('should skip duplicate listening events on re-ingestion', async () => {
    const fixedTime = new Date('2026-05-15T12:00:00.000Z').toISOString();
    const item = {
      trackTitle: 'Genesis',
      artistName: 'Justice',
      playedAt: fixedTime,
      durationMs: 234000,
      genres: ['French Electro', 'Dance'],
    };

    // First ingestion
    const res1 = await request(app)
      .post('/api/music/ingest')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ records: [item] });

    expect(res1.status).toBe(200);

    // Duplicate ingestion with exact same timestamp
    const res2 = await request(app)
      .post('/api/music/ingest')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ records: [item] });

    expect(res2.status).toBe(200);
    expect(res2.body.result.duplicatesSkipped).toBe(1);
    expect(res2.body.result.newEventsCreated).toBe(0);
  });
});

