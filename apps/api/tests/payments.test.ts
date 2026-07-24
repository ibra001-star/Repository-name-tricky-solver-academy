import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';

const app = createApp();

const student = {
  firstName: 'Pay',
  lastName: 'Student',
  email: `paystudent-${Date.now()}@example.com`,
  password: 'StrongPass123',
};

let studentToken: string;
let adminToken: string;
let subjectId: string;
let premiumExamId: string;
let freeExamId: string;
let couponQuestionId: string;

describe('Payments — coupons, guards, and premium gating', () => {
  beforeAll(async () => {
    const studentRes = await request(app).post('/api/v1/auth/register').send(student);
    studentToken = studentRes.body.data.accessToken;

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@trickysolver.academy', password: 'Admin@12345' });
    adminToken = loginRes.body.data.accessToken;

    const subject = await prisma.subject.findUnique({ where: { slug: 'mathematics' } });
    if (!subject) throw new Error('Seed data missing: run prisma db seed before tests');
    subjectId = subject.id;

    const topic = await prisma.topic.findFirst({ where: { subjectId, slug: 'algebra' } });
    if (!topic) throw new Error('Seed data missing: algebra topic not found');

    const teacher = await prisma.user.findUnique({ where: { email: 'teacher@trickysolver.academy' } });
    if (!teacher) throw new Error('Seed data missing: teacher account not found');

    const question = await prisma.question.create({
      data: {
        subjectId,
        topicId: topic.id,
        type: 'MULTIPLE_CHOICE',
        marks: 1,
        authorId: teacher.id,
        isApproved: true,
        content: { text: 'Payment test question', options: [{ id: 'a', text: 'x', isCorrect: true }] },
        solution: { steps: [], finalAnswer: 'x' },
      },
    });
    couponQuestionId = question.id;

    const premiumExamRes = await request(app)
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Premium Payment Test Exam',
        subjectId,
        examType: 'TOPICAL',
        durationMinutes: 10,
        isPremium: true,
        priceKes: 100,
        questionIds: [question.id],
      });
    premiumExamId = premiumExamRes.body.data.exam.id;
    await request(app)
      .patch(`/api/v1/exams/${premiumExamId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isPublished: true });

    const freeExamRes = await request(app)
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Free Payment Test Exam',
        subjectId,
        examType: 'TOPICAL',
        durationMinutes: 10,
        isPremium: false,
        questionIds: [question.id],
      });
    freeExamId = freeExamRes.body.data.exam.id;
    await request(app)
      .patch(`/api/v1/exams/${freeExamId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isPublished: true });
  });

  afterAll(async () => {
    await prisma.examAttempt.deleteMany({ where: { user: { email: student.email } } });
    await prisma.paperPurchase.deleteMany({ where: { user: { email: student.email } } });
    await prisma.payment.deleteMany({ where: { user: { email: student.email } } });
    await prisma.subscription.deleteMany({ where: { user: { email: student.email } } });
    await prisma.examQuestion.deleteMany({ where: { examId: { in: [premiumExamId, freeExamId] } } });
    await prisma.exam.deleteMany({ where: { id: { in: [premiumExamId, freeExamId] } } });
    await prisma.question.deleteMany({ where: { id: couponQuestionId } });
    await prisma.coupon.deleteMany({ where: { code: 'TESTCOUPON20' } });
    await prisma.user.deleteMany({ where: { email: student.email } });
    await prisma.$disconnect();
  });

  it('blocks access to a premium exam for a user with no subscription or purchase', async () => {
    const res = await request(app)
      .get(`/api/v1/exams/${premiumExamId}/take`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(402);
    expect(res.body.code).toBe('PAYMENT_REQUIRED');
  });

  it('blocks starting an attempt on a premium exam directly, not just the take endpoint', async () => {
    const res = await request(app)
      .post(`/api/v1/exams/${premiumExamId}/attempts`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(402);
  });

  it('allows access to a free exam with no payment', async () => {
    const res = await request(app)
      .get(`/api/v1/exams/${freeExamId}/take`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
  });

  it('rejects an invalid coupon code', async () => {
    const res = await request(app)
      .post('/api/v1/payments/coupons/validate')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ code: 'DOESNOTEXIST' });
    expect(res.status).toBe(400);
  });

  it('lets an admin create a coupon', async () => {
    const res = await request(app)
      .post('/api/v1/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'testcoupon20', discountPercent: 20, maxUses: 5 });
    expect(res.status).toBe(201);
    expect(res.body.data.coupon.code).toBe('TESTCOUPON20'); // normalized to uppercase
  });

  it('rejects a duplicate coupon code', async () => {
    const res = await request(app)
      .post('/api/v1/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'TESTCOUPON20', discountPercent: 10 });
    expect(res.status).toBe(409);
  });

  it('validates a real coupon and returns its discount', async () => {
    const res = await request(app)
      .post('/api/v1/payments/coupons/validate')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ code: 'testcoupon20' });
    expect(res.status).toBe(200);
    expect(res.body.data.discountPercent).toBe(20);
  });

  it('rejects M-Pesa payment initiation without a phone number', async () => {
    const res = await request(app)
      .post('/api/v1/payments/subscriptions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ plan: 'MONTHLY', provider: 'MPESA' });
    expect(res.status).toBe(400);
  });

  it('rejects an invalid Kenyan phone number format', async () => {
    const res = await request(app)
      .post('/api/v1/payments/subscriptions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ plan: 'MONTHLY', provider: 'MPESA', phone: '12345' });
    expect(res.status).toBe(400);
  });

  it('rejects Stripe subscription initiation when Stripe is not configured', async () => {
    // In this test environment STRIPE_SECRET_KEY is empty, so the service
    // should fail gracefully with a clear error rather than crashing.
    const res = await request(app)
      .post('/api/v1/payments/subscriptions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ plan: 'MONTHLY', provider: 'STRIPE' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not configured/i);
  });

  it('rejects paper purchase for a free exam', async () => {
    const res = await request(app)
      .post('/api/v1/payments/papers')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ examId: freeExamId, provider: 'STRIPE' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for a payment status check on a payment that does not belong to the user', async () => {
    const res = await request(app)
      .get('/api/v1/payments/00000000-0000-0000-0000-000000000000/status')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(404);
  });

  it('lists an empty payment history for a user with no payments', async () => {
    const res = await request(app).get('/api/v1/payments/mine').set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.payments)).toBe(true);
  });
});
