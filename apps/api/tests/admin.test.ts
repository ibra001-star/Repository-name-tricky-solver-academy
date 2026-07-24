import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';

const app = createApp();

const student = {
  firstName: 'Admin',
  lastName: 'TestStudent',
  email: `admintest-${Date.now()}@example.com`,
  password: 'StrongPass123',
};

let studentToken: string;
let studentId: string;
let adminToken: string;
let teacherToken: string;

describe('Admin, notifications, and certificates', () => {
  beforeAll(async () => {
    const studentRes = await request(app).post('/api/v1/auth/register').send(student);
    studentToken = studentRes.body.data.accessToken;
    studentId = studentRes.body.data.user.id;

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@trickysolver.academy', password: 'Admin@12345' });
    adminToken = adminLogin.body.data.accessToken;

    const teacherLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'teacher@trickysolver.academy', password: 'Teacher@12345' });
    teacherToken = teacherLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({ where: { userId: studentId } });
    await prisma.user.deleteMany({ where: { email: student.email } });
    await prisma.$disconnect();
  });

  describe('Admin access control', () => {
    it('rejects a student from accessing admin routes', async () => {
      const res = await request(app).get('/api/v1/admin/stats').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('rejects a teacher from accessing admin routes', async () => {
      const res = await request(app).get('/api/v1/admin/stats').set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(403);
    });

    it('allows an admin to view platform stats', async () => {
      const res = await request(app).get('/api/v1/admin/stats').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(typeof res.body.data.stats.totalStudents).toBe('number');
    });

    it('allows an admin to view the revenue summary', async () => {
      const res = await request(app).get('/api/v1/admin/revenue').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(typeof res.body.data.summary.totalRevenueKes).toBe('number');
    });

    it('allows an admin to list and search users', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .query({ search: student.email })
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.users.some((u: { email: string }) => u.email === student.email)).toBe(true);
    });

    it('prevents an admin from deactivating their own account', async () => {
      const meRes = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${adminToken}`);
      const adminId = meRes.body.data.user.id;

      const res = await request(app)
        .patch(`/api/v1/admin/users/${adminId}/active`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });
      expect(res.status).toBe(400);
    });

    it('allows an admin to deactivate a student account', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${studentId}/active`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });
      expect(res.status).toBe(200);
      expect(res.body.data.user.isActive).toBe(false);

      // Reactivate for subsequent tests
      await request(app)
        .patch(`/api/v1/admin/users/${studentId}/active`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: true });
    });

    it('has a SUPER_ADMIN seeded account (sanity check for role-escalation test assumptions)', async () => {
      const plainAdmin = await prisma.user.findUnique({ where: { email: 'admin@trickysolver.academy' } });
      expect(plainAdmin?.role).toBe('SUPER_ADMIN');
    });

    it('rejects an invalid role value on validation', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${studentId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'SUPREME_LEADER' });
      expect(res.status).toBe(400);
    });

    it('allows viewing audit logs', async () => {
      const res = await request(app).get('/api/v1/admin/audit-logs').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.logs)).toBe(true);
    });
  });

  describe('Notifications', () => {
    it('returns an empty notification list with unread count 0 for a new user', async () => {
      const res = await request(app).get('/api/v1/notifications').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.unreadCount).toBe(0);
    });

    it('lets a user mark all notifications as read without error even when there are none', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
    });

    it('returns 404 marking a nonexistent notification as read', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/00000000-0000-0000-0000-000000000000/read')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('Certificates', () => {
    it('returns 404 for a certificate on an attempt that does not exist', async () => {
      const res = await request(app)
        .get('/api/v1/certificates/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(404);
    });

    it('lists an empty download history for a new user', async () => {
      const res = await request(app)
        .get('/api/v1/certificates/downloads/mine')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.downloads)).toBe(true);
    });
  });

  describe('Uploads', () => {
    it('rejects a student from creating a teacher upload', async () => {
      const res = await request(app)
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Test Paper')
        .field('subjectArea', 'Mathematics');
      expect(res.status).toBe(403);
    });

    it('rejects a teacher upload with no file attached', async () => {
      const res = await request(app)
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${teacherToken}`)
        .field('title', 'Test Paper')
        .field('subjectArea', 'Mathematics');
      expect(res.status).toBe(400);
    });

    it('lists approved uploads publicly with no auth required', async () => {
      const res = await request(app).get('/api/v1/uploads');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.uploads)).toBe(true);
    });

    it('rejects a student from viewing the pending uploads queue', async () => {
      const res = await request(app).get('/api/v1/uploads/pending').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });
  });
});
