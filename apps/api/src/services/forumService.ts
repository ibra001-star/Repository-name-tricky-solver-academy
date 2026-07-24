import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { CreateThreadInput, ListThreadsQuery } from '../utils/validators/communityValidators';

export const listThreads = async (query: ListThreadsQuery) => {
  const where: Prisma.ForumThreadWhereInput = {};
  if (query.subject) where.subject = { slug: query.subject };
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { body: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const skip = (query.page - 1) * query.limit;

  const [threads, total] = await Promise.all([
    prisma.forumThread.findMany({
      where,
      include: {
        author: { select: { firstName: true, lastName: true, role: true } },
        subject: true,
        _count: { select: { posts: true } },
      },
      // Pinned threads first, then most recently active.
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
      skip,
      take: query.limit,
    }),
    prisma.forumThread.count({ where }),
  ]);

  return {
    threads,
    pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
  };
};

export const getThread = async (threadId: string) => {
  const thread = await prisma.forumThread
    .update({
      where: { id: threadId },
      data: { viewCount: { increment: 1 } },
      include: {
        author: { select: { firstName: true, lastName: true, role: true } },
        subject: true,
        posts: {
          include: { author: { select: { firstName: true, lastName: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    .catch(() => null);

  if (!thread) throw AppError.notFound('Thread not found');
  return thread;
};

export const createThread = async (authorId: string, input: CreateThreadInput) => {
  if (input.subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: input.subjectId } });
    if (!subject) throw AppError.badRequest('Subject not found');
  }

  return prisma.forumThread.create({
    data: { authorId, title: input.title, body: input.body, subjectId: input.subjectId },
    include: { author: { select: { firstName: true, lastName: true, role: true } }, subject: true },
  });
};

export const createPost = async (threadId: string, authorId: string, body: string) => {
  const thread = await prisma.forumThread.findUnique({ where: { id: threadId } });
  if (!thread) throw AppError.notFound('Thread not found');
  if (thread.isLocked) throw AppError.badRequest('This thread is locked and no longer accepting replies');

  const [post] = await prisma.$transaction([
    prisma.forumPost.create({
      data: { threadId, authorId, body },
      include: { author: { select: { firstName: true, lastName: true, role: true } } },
    }),
    // Bump the thread's updatedAt so "most recently active" sorting reflects new replies.
    prisma.forumThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } }),
  ]);

  return post;
};

export const deleteThread = async (threadId: string, requester: { id: string; role: string }) => {
  const thread = await prisma.forumThread.findUnique({ where: { id: threadId } });
  if (!thread) throw AppError.notFound('Thread not found');

  const isOwner = thread.authorId === requester.id;
  const isPrivileged = requester.role === 'ADMIN' || requester.role === 'SUPER_ADMIN';
  if (!isOwner && !isPrivileged) throw AppError.forbidden('You can only delete your own threads');

  await prisma.forumThread.delete({ where: { id: threadId } });
};

export const deletePost = async (postId: string, requester: { id: string; role: string }) => {
  const post = await prisma.forumPost.findUnique({ where: { id: postId } });
  if (!post) throw AppError.notFound('Post not found');

  const isOwner = post.authorId === requester.id;
  const isPrivileged = requester.role === 'ADMIN' || requester.role === 'SUPER_ADMIN';
  if (!isOwner && !isPrivileged) throw AppError.forbidden('You can only delete your own posts');

  await prisma.forumPost.delete({ where: { id: postId } });
};

export const setThreadModeration = async (threadId: string, data: { isPinned?: boolean; isLocked?: boolean }) => {
  const thread = await prisma.forumThread.findUnique({ where: { id: threadId } });
  if (!thread) throw AppError.notFound('Thread not found');

  return prisma.forumThread.update({ where: { id: threadId }, data });
};
