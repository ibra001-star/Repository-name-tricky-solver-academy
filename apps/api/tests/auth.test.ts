import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';

const app = createApp();

const testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: `test-${Date.now()}@example.com`,
  password: 'StrongPass123',
};

describe('Auth flow', () => {
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.$disconnect();
  });

  it('registers a new user and returns an access token', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.role).toBe('STUDENT');
  });

  it('rejects duplicate registration', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(testUser);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DUPLICATE_ENTRY');
  });

  it('rejects registration with a weak password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...testUser, email: 'weak@example.com', password: 'weak' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects login with wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: testUser.email,
      password: 'WrongPassword123',
    });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('rejects access to /auth/me without a token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('allows access to /auth/me with a valid access token', async () => {
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });
    const token = loginRes.body.data.accessToken;

    const meRes = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe(testUser.email);
  });

  it('rotates refresh token via cookie', async () => {
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });
    const cookies = loginRes.headers['set-cookie'];

    const refreshRes = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookies);
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeDefined();
  });
});

describe('Health check', () => {
  it('reports healthy status with DB connectivity', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Subjects', () => {
  it('lists active subjects publicly', async () => {
    const res = await request(app).get('/api/v1/subjects');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.subjects)).toBe(true);
  });
});
