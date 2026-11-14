import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createServer } from '../src/server.js';

const app = createServer();

describe('Auth Endpoints', () => {
  const randomSuffix = Math.floor(Math.random() * 100000);
  const testUser = {
    email: `test_${randomSuffix}@tunescope.app`,
    password: 'password123',
    username: `user_${randomSuffix}`,
    displayName: 'Test Listener',
  };

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
  });

  it('should reject registration with duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('already exists');
  });

  it('should log in successfully with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Invalid email or password');
  });

  it('should log in instantly with demo-login', async () => {
    const res = await request(app).post('/api/auth/demo-login');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('alex@tunescope.app');
  });
});

