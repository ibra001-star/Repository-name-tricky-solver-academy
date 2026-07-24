import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';

const app = createApp();

const teacher = {
  firstName: 'Test',
  lastName: 'Teacher',
  email: `teacher-${Date.now()}@example.com`,
  password: 'StrongPass123',
  role: 'TEACHER' as const,
};

const student = {
  firstName: 'Test',
  lastName: 'Student',
  email: `student-${Date.now()}@example.com`,
  password: 'StrongPass123',
};

let teacherToken: string;
let studentToken: string;
let subjectId: string;
let topicId: string;
let mcqQuestionId: string;
let examId: string;
let attemptId: string;

describe('Question bank & exam engine', () => {
  beforeAll(async () => {
    // Register teacher and student, and grab a real subject/topic from the seed data.
    const teacherRes = await request(app).post('/api/v1/auth/register').send(teacher);
    teacherToken = teacherRes.body.data.accessToken;

    const studentRes = await request(app).post('/api/v1/auth/register').send(student);
    studentToken = studentRes.body.data.accessToken;

    const subject = await prisma.subject.findUnique({ where: { slug: 'mathematics' } });
    if (!subject) throw new Error('Seed data missing: run prisma db seed before tests');
    subjectId = subject.id;

    const topic = await prisma.topic.findFirst({ where: { subjectId, slug: 'algebra' } });
    if (!topic) throw new Error('Seed data missing: algebra topic not found');
    topicId = topic.id;
  });

  afterAll(async () => {
    await prisma.examAttempt.deleteMany({ where: { user: { email: student.email } } });
    await prisma.examQuestion.deleteMany({ where: { exam: { createdBy: { email: teacher.email } } } });
    await prisma.exam.deleteMany({ where: { createdBy: { email: teacher.email } } });
    await prisma.bookmark.deleteMany({ where: { user: { email: student.email } } });
    await prisma.question.deleteMany({ where: { author: { email: teacher.email } } });
    await prisma.user.deleteMany({ where: { email: { in: [teacher.email, student.email] } } });
    await prisma.$disconnect();
  });

  it('lets a teacher create a multiple-choice question', async () => {
    const res = await request(app)
      .post('/api/v1/questions')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        subjectId,
        topicId,
        type: 'MULTIPLE_CHOICE',
        difficulty: 'EASY',
        curriculum: 'KCSE',
        form: 1,
        marks: 2,
        tags: ['integers'],
        content: {
          text: 'What is 7 + 5?',
          options: [
            { id: 'a', text: '10', isCorrect: false },
            { id: 'b', text: '12', isCorrect: true },
            { id: 'c', text: '13', isCorrect: false },
          ],
        },
        solution: { steps: ['Add 7 and 5'], finalAnswer: '12' },
      });

    expect(res.status).toBe(201);
    expect(res.body.data.question.id).toBeDefined();
    mcqQuestionId = res.body.data.question.id;
  });

  it('rejects question creation from a student', async () => {
    const res = await request(app)
      .post('/api/v1/questions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        subjectId,
        topicId,
        type: 'MULTIPLE_CHOICE',
        content: { text: 'x', options: [{ id: 'a', text: 'y', isCorrect: true }] },
        solution: { finalAnswer: 'y' },
      });
    expect(res.status).toBe(403);
  });

  it('does not show unapproved questions in the public list', async () => {
    const res = await request(app).get('/api/v1/questions').query({ subject: 'mathematics' });
    expect(res.status).toBe(200);
    const found = res.body.data.questions.find((q: { id: string }) => q.id === mcqQuestionId);
    expect(found).toBeUndefined();
  });

  it('lets an admin approve the question', async () => {
    // Use the seeded super admin to approve.
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@trickysolver.academy', password: 'Admin@12345' });
    expect(loginRes.status).toBe(200);
    const adminToken = loginRes.body.data.accessToken;

    const res = await request(app)
      .patch(`/api/v1/questions/${mcqQuestionId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isApproved: true });

    expect(res.status).toBe(200);
    expect(res.body.data.question.isApproved).toBe(true);
  });

  it('strips solutions from the public question list for students', async () => {
    const res = await request(app).get('/api/v1/questions').query({ subject: 'mathematics' });
    const found = res.body.data.questions.find((q: { id: string }) => q.id === mcqQuestionId);
    expect(found).toBeDefined();
    expect(found.solution).toBeUndefined();
  });

  it('toggles a bookmark for a student', async () => {
    const res = await request(app)
      .post(`/api/v1/questions/${mcqQuestionId}/bookmark`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.bookmarked).toBe(true);

    const listRes = await request(app)
      .get('/api/v1/questions/bookmarks')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(listRes.body.data.bookmarks.length).toBeGreaterThan(0);
  });

  it('lets a teacher build an exam from the approved question', async () => {
    const res = await request(app)
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'Algebra Quickfire Test',
        subjectId,
        examType: 'TOPICAL',
        curriculum: 'KCSE',
        form: 1,
        durationMinutes: 10,
        questionIds: [mcqQuestionId],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.exam.totalMarks).toBe(2);
    examId = res.body.data.exam.id;
  });

  it('does not allow taking an unpublished exam', async () => {
    const res = await request(app).get(`/api/v1/exams/${examId}/take`);
    expect(res.status).toBe(404);
  });

  it('lets an admin publish the exam', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@trickysolver.academy', password: 'Admin@12345' });
    const adminToken = loginRes.body.data.accessToken;

    const res = await request(app)
      .patch(`/api/v1/exams/${examId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isPublished: true });

    expect(res.status).toBe(200);
    expect(res.body.data.exam.isPublished).toBe(true);
  });

  it('serves the exam for taking without answer keys', async () => {
    const res = await request(app).get(`/api/v1/exams/${examId}/take`);
    expect(res.status).toBe(200);
    const question = res.body.data.exam.questions[0];
    expect(question.content.options.every((o: { isCorrect?: boolean }) => o.isCorrect === undefined)).toBe(true);
  });

  it('starts an attempt for a student', async () => {
    const res = await request(app)
      .post(`/api/v1/exams/${examId}/attempts`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.attempt.status).toBe('IN_PROGRESS');
    attemptId = res.body.data.attempt.id;
  });

  it('resumes the same in-progress attempt instead of creating a new one', async () => {
    const res = await request(app)
      .post(`/api/v1/exams/${examId}/attempts`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.attempt.id).toBe(attemptId);
  });

  it('autosaves an answer during the attempt', async () => {
    const res = await request(app)
      .patch(`/api/v1/exams/attempts/${attemptId}/autosave`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ questionId: mcqQuestionId, response: 'b' });
    expect(res.status).toBe(200);
  });

  it('submits the attempt and marks it instantly with the correct score', async () => {
    const res = await request(app)
      .post(`/api/v1/exams/attempts/${attemptId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.data.attempt.status).toBe('MARKED');
    expect(res.body.data.attempt.score).toBe(2);
    expect(res.body.data.attempt.percentage).toBe(100);
  });

  it('rejects submitting an already-submitted attempt', async () => {
    const res = await request(app)
      .post(`/api/v1/exams/attempts/${attemptId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns the full result with solutions after submission', async () => {
    const res = await request(app)
      .get(`/api/v1/exams/attempts/${attemptId}/result`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.result.questions[0].solution).toBeDefined();
    expect(res.body.data.result.questions[0].isCorrect).toBe(true);
  });

  it('lists the attempt in the student attempt history', async () => {
    const res = await request(app)
      .get('/api/v1/exams/attempts/mine')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.attempts.some((a: { id: string }) => a.id === attemptId)).toBe(true);
  });

  it('shows the student on the exam leaderboard', async () => {
    const res = await request(app).get(`/api/v1/exams/${examId}/leaderboard`);
    expect(res.status).toBe(200);
    expect(res.body.data.leaderboard.length).toBeGreaterThan(0);
    expect(res.body.data.leaderboard[0].percentage).toBe(100);
  });
});
