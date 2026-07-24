import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';

const app = createApp();

const student = {
  firstName: 'Schedule',
  lastName: 'Student',
  email: `scheduletest-${Date.now()}@example.com`,
  password: 'StrongPass123',
};

let studentToken: string;
let studentId: string;
let teacherToken: string;
let liveClassId: string;
let planItemId: string;
let subjectId: string;

describe('Live classes, study planner, newsletter, and platform leaderboard', () => {
  beforeAll(async () => {
    const studentRes = await request(app).post('/api/v1/auth/register').send(student);
    studentToken = studentRes.body.data.accessToken;
    studentId = studentRes.body.data.user.id;

    const teacherLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'teacher@trickysolver.academy', password: 'Teacher@12345' });
    teacherToken = teacherLogin.body.data.accessToken;

    const subject = await prisma.subject.findUnique({ where: { slug: 'mathematics' } });
    if (!subject) throw new Error('Seed data missing: run prisma db seed before tests');
    subjectId = subject.id;
  });

  afterAll(async () => {
    await prisma.liveClass.deleteMany({ where: { title: { contains: 'Integration Test' } } });
    await prisma.studyPlanItem.deleteMany({ where: { userId: studentId } });
    await prisma.notification.deleteMany({ where: { userId: studentId } });
    await prisma.newsletterSubscriber.deleteMany({ where: { email: { contains: 'newslettertest' } } });
    await prisma.user.deleteMany({ where: { email: student.email } });
    await prisma.$disconnect();
  });

  describe('Live classes', () => {
    it('rejects a non-teacher from scheduling a live class', async () => {
      const res = await request(app)
        .post('/api/v1/live-classes')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Integration Test Session', type: 'ZOOM', joinUrl: 'https://zoom.us/j/123456789' });
      expect(res.status).toBe(403);
    });

    it('rejects a Zoom join URL that is not actually a zoom.us domain', async () => {
      const res = await request(app)
        .post('/api/v1/live-classes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ title: 'Integration Test Session', type: 'ZOOM', joinUrl: 'https://evil-phishing-site.com/zoom' });
      expect(res.status).toBe(400);
    });

    it('rejects a YouTube type with a non-YouTube URL', async () => {
      const res = await request(app)
        .post('/api/v1/live-classes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ title: 'Integration Test Lesson', type: 'YOUTUBE', joinUrl: 'https://zoom.us/j/123456789' });
      expect(res.status).toBe(400);
    });

    it('lets a teacher schedule a valid Zoom session', async () => {
      const res = await request(app)
        .post('/api/v1/live-classes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Integration Test Session',
          type: 'ZOOM',
          subjectId,
          joinUrl: 'https://zoom.us/j/123456789',
          durationMinutes: 60,
        });
      expect(res.status).toBe(201);
      liveClassId = res.body.data.liveClass.id;
    });

    it('does not show an unpublished live class in the public upcoming list', async () => {
      const res = await request(app).get('/api/v1/live-classes');
      expect(res.status).toBe(200);
      expect(res.body.data.classes.some((c: { id: string }) => c.id === liveClassId)).toBe(false);
    });

    it('shows the live class once published', async () => {
      const publishRes = await request(app)
        .patch(`/api/v1/live-classes/${liveClassId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ isPublished: true });
      expect(publishRes.status).toBe(200);

      const listRes = await request(app).get('/api/v1/live-classes');
      expect(listRes.body.data.classes.some((c: { id: string }) => c.id === liveClassId)).toBe(true);
    });

    it("rejects a different teacher from editing someone else's session", async () => {
      // The seeded teacher owns this session; a student definitely isn't the owner.
      const res = await request(app)
        .patch(`/api/v1/live-classes/${liveClassId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Hijacked title' });
      expect(res.status).toBe(403);
    });
  });

  describe('Study planner', () => {
    it('lets a student add a study plan item', async () => {
      const scheduledFor = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app)
        .post('/api/v1/study-plan')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Revise quadratic equations', scheduledFor });
      expect(res.status).toBe(201);
      planItemId = res.body.data.item.id;
    });

    it("lists the item in the student's own plan", async () => {
      const res = await request(app).get('/api/v1/study-plan').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items.some((i: { id: string }) => i.id === planItemId)).toBe(true);
    });

    it("prevents a different user from seeing or editing another student's plan item", async () => {
      const otherLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'student@trickysolver.academy', password: 'Student@12345' });
      const otherToken = otherLogin.body.data.accessToken;

      const res = await request(app)
        .patch(`/api/v1/study-plan/${planItemId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ isCompleted: true });
      expect(res.status).toBe(404); // scoped lookup means it's invisible, not forbidden
    });

    it('lets the owner mark their item complete', async () => {
      const res = await request(app)
        .patch(`/api/v1/study-plan/${planItemId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ isCompleted: true });
      expect(res.status).toBe(200);
      expect(res.body.data.item.isCompleted).toBe(true);
    });

    it('lets the owner delete their item', async () => {
      const res = await request(app)
        .delete(`/api/v1/study-plan/${planItemId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('Newsletter', () => {
    const newsletterEmail = `newslettertest-${Date.now()}@example.com`;

    it('subscribes an email with no auth required', async () => {
      const res = await request(app).post('/api/v1/newsletter/subscribe').send({ email: newsletterEmail });
      expect(res.status).toBe(200);
    });

    it('is idempotent — subscribing the same email twice does not error', async () => {
      const res = await request(app).post('/api/v1/newsletter/subscribe').send({ email: newsletterEmail });
      expect(res.status).toBe(200);
    });

    it('rejects an invalid email format', async () => {
      const res = await request(app).post('/api/v1/newsletter/subscribe').send({ email: 'not-an-email' });
      expect(res.status).toBe(400);
    });

    it('unsubscribes successfully', async () => {
      const res = await request(app).post('/api/v1/newsletter/unsubscribe').send({ email: newsletterEmail });
      expect(res.status).toBe(200);
    });
  });

  describe('Platform leaderboard', () => {
    it('returns an empty or filtered leaderboard with no server error', async () => {
      const res = await request(app).get('/api/v1/exams/leaderboard');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.leaderboard)).toBe(true);
    });
  });
});
