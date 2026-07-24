import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';

const app = createApp();

const userA = {
  firstName: 'Forum',
  lastName: 'UserA',
  email: `forumusera-${Date.now()}@example.com`,
  password: 'StrongPass123',
};
const userB = {
  firstName: 'Forum',
  lastName: 'UserB',
  email: `forumuserb-${Date.now()}@example.com`,
  password: 'StrongPass123',
};

let tokenA: string;
let userAId: string;
let tokenB: string;
let userBId: string;
let adminToken: string;
let threadId: string;
let postId: string;

describe('Forum, messaging, blog, and referrals', () => {
  beforeAll(async () => {
    const resA = await request(app).post('/api/v1/auth/register').send(userA);
    tokenA = resA.body.data.accessToken;
    userAId = resA.body.data.user.id;

    const resB = await request(app).post('/api/v1/auth/register').send(userB);
    tokenB = resB.body.data.accessToken;
    userBId = resB.body.data.user.id;

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@trickysolver.academy', password: 'Admin@12345' });
    adminToken = adminLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.forumPost.deleteMany({ where: { authorId: { in: [userAId, userBId] } } });
    await prisma.forumThread.deleteMany({ where: { authorId: { in: [userAId, userBId] } } });
    await prisma.message.deleteMany({ where: { OR: [{ senderId: userAId }, { recipientId: userAId }] } });
    await prisma.notification.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
    await prisma.referral.deleteMany({ where: { refereeId: { in: [userAId, userBId] } } });
    await prisma.blogPost.deleteMany({ where: { title: { contains: 'Integration Test Post' } } });
    await prisma.user.deleteMany({ where: { email: { in: [userA.email, userB.email] } } });
    await prisma.$disconnect();
  });

  describe('Forum', () => {
    it('lets a user create a thread', async () => {
      const res = await request(app)
        .post('/api/v1/forum/threads')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'How do I solve quadratic equations?',
          body: 'I keep getting stuck on the discriminant step.',
        });
      expect(res.status).toBe(201);
      threadId = res.body.data.thread.id;
    });

    it('rejects a thread with too short a title', async () => {
      const res = await request(app)
        .post('/api/v1/forum/threads')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Hi', body: 'Short title should fail validation here' });
      expect(res.status).toBe(400);
    });

    it('lists threads publicly with no auth', async () => {
      const res = await request(app).get('/api/v1/forum/threads');
      expect(res.status).toBe(200);
      expect(res.body.data.threads.some((t: { id: string }) => t.id === threadId)).toBe(true);
    });

    it('lets a second user reply to the thread', async () => {
      const res = await request(app)
        .post(`/api/v1/forum/threads/${threadId}/posts`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ body: 'Try factoring first, then use the quadratic formula if that fails.' });
      expect(res.status).toBe(201);
      postId = res.body.data.post.id;
    });

    it('increments the view count when the thread is fetched', async () => {
      const res1 = await request(app).get(`/api/v1/forum/threads/${threadId}`);
      const firstCount = res1.body.data.thread.viewCount;
      const res2 = await request(app).get(`/api/v1/forum/threads/${threadId}`);
      expect(res2.body.data.thread.viewCount).toBeGreaterThan(firstCount);
    });

    it("rejects a non-owner, non-admin from deleting someone else's post", async () => {
      const res = await request(app)
        .delete(`/api/v1/forum/posts/${postId}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(403);
    });

    it('lets an admin pin a thread', async () => {
      const res = await request(app)
        .patch(`/api/v1/forum/threads/${threadId}/moderate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isPinned: true });
      expect(res.status).toBe(200);
      expect(res.body.data.thread.isPinned).toBe(true);
    });

    it('blocks replies once a thread is locked', async () => {
      await request(app)
        .patch(`/api/v1/forum/threads/${threadId}/moderate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isLocked: true });

      const res = await request(app)
        .post(`/api/v1/forum/threads/${threadId}/posts`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ body: 'This should not be allowed' });
      expect(res.status).toBe(400);
    });
  });

  describe('Messaging', () => {
    it('lets a user send a direct message', async () => {
      const res = await request(app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ recipientId: userBId, body: 'Hi, can you help me with Form 3 algebra?' });
      expect(res.status).toBe(201);
    });

    it('rejects sending a message to yourself', async () => {
      const res = await request(app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ recipientId: userAId, body: 'Talking to myself' });
      expect(res.status).toBe(400);
    });

    it("shows the conversation in both participants' conversation lists", async () => {
      const resA = await request(app).get('/api/v1/messages/conversations').set('Authorization', `Bearer ${tokenA}`);
      expect(resA.body.data.conversations.some((c: { partner: { id: string } }) => c.partner.id === userBId)).toBe(
        true
      );

      const resB = await request(app).get('/api/v1/messages/conversations').set('Authorization', `Bearer ${tokenB}`);
      expect(resB.body.data.conversations.some((c: { partner: { id: string } }) => c.partner.id === userAId)).toBe(
        true
      );
    });

    it('marks messages as read when the recipient views the conversation', async () => {
      const before = await request(app)
        .get('/api/v1/messages/conversations')
        .set('Authorization', `Bearer ${tokenB}`);
      const unreadBefore = before.body.data.conversations.find(
        (c: { partner: { id: string }; unread: number }) => c.partner.id === userAId
      )?.unread;
      expect(unreadBefore).toBeGreaterThan(0);

      await request(app).get(`/api/v1/messages/conversations/${userAId}`).set('Authorization', `Bearer ${tokenB}`);

      const after = await request(app)
        .get('/api/v1/messages/conversations')
        .set('Authorization', `Bearer ${tokenB}`);
      const unreadAfter = after.body.data.conversations.find(
        (c: { partner: { id: string }; unread: number }) => c.partner.id === userAId
      )?.unread;
      expect(unreadAfter).toBe(0);
    });
  });

  describe('Blog', () => {
    it('rejects a non-admin from creating a blog post', async () => {
      const res = await request(app)
        .post('/api/v1/blog')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Integration Test Post', excerpt: 'A short excerpt here', content: 'Full body content here' });
      expect(res.status).toBe(403);
    });

    it('lets an admin create a draft post and publish it', async () => {
      const createRes = await request(app)
        .post('/api/v1/blog')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Integration Test Post — Study Tips',
          excerpt: 'A short excerpt about study tips',
          content: 'Full content body about how to study effectively for KCSE.',
        });
      expect(createRes.status).toBe(201);
      expect(createRes.body.data.post.isPublished).toBe(false);
      const blogPostId = createRes.body.data.post.id;
      const slug = createRes.body.data.post.slug;

      // Unpublished post should not be visible publicly yet.
      const notFoundRes = await request(app).get(`/api/v1/blog/${slug}`);
      expect(notFoundRes.status).toBe(404);

      const publishRes = await request(app)
        .patch(`/api/v1/blog/${blogPostId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isPublished: true });
      expect(publishRes.status).toBe(200);
      expect(publishRes.body.data.post.publishedAt).toBeDefined();

      const publicRes = await request(app).get(`/api/v1/blog/${slug}`);
      expect(publicRes.status).toBe(200);
    });
  });

  describe('Referrals', () => {
    it('generates a referral code for a user on first request', async () => {
      const res = await request(app).get('/api/v1/referrals/code').set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(200);
      expect(typeof res.body.data.referralCode).toBe('string');
      expect(res.body.data.referralCode.length).toBeGreaterThan(0);
    });

    it('returns the same code on subsequent requests', async () => {
      const res1 = await request(app).get('/api/v1/referrals/code').set('Authorization', `Bearer ${tokenA}`);
      const res2 = await request(app).get('/api/v1/referrals/code').set('Authorization', `Bearer ${tokenA}`);
      expect(res1.body.data.referralCode).toBe(res2.body.data.referralCode);
    });

    it('returns empty referral stats for a user nobody has referred', async () => {
      const res = await request(app).get('/api/v1/referrals/stats').set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(200);
      expect(res.body.data.stats.totalReferred).toBe(0);
    });
  });
});
