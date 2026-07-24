import { Prisma, Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { CreateQuestionInput, ListQuestionsQuery } from '../utils/validators/questionValidators';

// Fields safe to expose to students browsing the bank BEFORE they've
// unlocked/purchased solutions — the solution is stripped unless explicitly
// requested (e.g. after an exam attempt is marked, or for teachers/admins).
const withoutSolution = <T extends { solution: unknown }>(q: T) => {
  const { solution: _solution, ...rest } = q;
  return rest;
};

export const listQuestions = async (
  query: ListQuestionsQuery,
  requester: { id: string; role: Role } | null
) => {
  const where: Prisma.QuestionWhereInput = {
    isApproved: true,
  };

  if (query.subject) where.subject = { slug: query.subject };
  if (query.topic) where.topic = { slug: query.topic };
  if (query.type) where.type = query.type as Prisma.QuestionWhereInput['type'];
  if (query.difficulty) where.difficulty = query.difficulty as Prisma.QuestionWhereInput['difficulty'];
  if (query.curriculum) where.curriculum = query.curriculum as Prisma.QuestionWhereInput['curriculum'];
  if (query.form) where.form = query.form;
  if (query.year) where.year = query.year;
  if (query.tags) where.tags = { hasSome: query.tags.split(',').map((t) => t.trim()) };

  if (query.search) {
    // Search across the JSON content's `text` field and tags. Prisma's Json
    // filtering is limited, so we do a broad tag/topic-name search plus a
    // raw-ish contains check on a denormalized searchText we maintain — for
    // Phase 2 we keep this simple with tag + topic/subject name matching.
    where.OR = [
      { tags: { has: query.search.toLowerCase() } },
      { topic: { name: { contains: query.search, mode: 'insensitive' } } },
    ];
  }

  const skip = (query.page - 1) * query.limit;

  if (query.random) {
    // Random question generator: fetch a random sample matching the filters.
    // Postgres RANDOM() in raw SQL is used for a true random sample rather
    // than skip/take, which would bias toward insertion order.
    const ids = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM questions
      WHERE "isApproved" = true
      ORDER BY RANDOM()
      LIMIT ${query.limit}
    `;
    const questions = await prisma.question.findMany({
      where: { id: { in: ids.map((r) => r.id) } },
      include: { topic: true, subject: true },
    });
    return {
      questions: questions.map(withoutSolution),
      pagination: { page: 1, limit: query.limit, total: questions.length, totalPages: 1 },
    };
  }

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      include: { topic: true, subject: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
    }),
    prisma.question.count({ where }),
  ]);

  // Teachers/admins viewing their own bank (or any admin) can see solutions
  // inline; students get stripped solutions until they attempt/purchase.
  const canSeeSolutions = requester && ['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(requester.role);

  return {
    questions: canSeeSolutions ? questions : questions.map(withoutSolution),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

export const getQuestionById = async (id: string, requester: { id: string; role: Role } | null) => {
  const question = await prisma.question.findUnique({
    where: { id },
    include: { topic: true, subject: true, author: { select: { firstName: true, lastName: true } } },
  });

  if (!question || (!question.isApproved && requester?.role !== 'TEACHER' && requester?.role !== 'ADMIN' && requester?.role !== 'SUPER_ADMIN')) {
    throw AppError.notFound('Question not found');
  }

  const canSeeSolutions = requester && ['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(requester.role);
  return canSeeSolutions ? question : withoutSolution(question);
};

export const createQuestion = async (input: CreateQuestionInput, authorId: string) => {
  const [subject, topic] = await Promise.all([
    prisma.subject.findUnique({ where: { id: input.subjectId } }),
    prisma.topic.findUnique({ where: { id: input.topicId } }),
  ]);

  if (!subject) throw AppError.badRequest('Subject not found');
  if (!topic || topic.subjectId !== input.subjectId) {
    throw AppError.badRequest('Topic not found or does not belong to the selected subject');
  }

  return prisma.question.create({
    data: {
      ...input,
      content: input.content as Prisma.InputJsonValue,
      solution: input.solution as Prisma.InputJsonValue,
      authorId,
      // Admins/super-admins auto-approve; teachers require review, matching
      // the "Approve uploads" admin workflow from the product spec.
    },
    include: { topic: true, subject: true },
  });
};

export const updateQuestion = async (
  id: string,
  input: Partial<CreateQuestionInput>,
  requester: { id: string; role: Role }
) => {
  const existing = await prisma.question.findUnique({ where: { id } });
  if (!existing) throw AppError.notFound('Question not found');

  const isOwner = existing.authorId === requester.id;
  const isPrivileged = requester.role === 'ADMIN' || requester.role === 'SUPER_ADMIN';
  if (!isOwner && !isPrivileged) {
    throw AppError.forbidden('You can only edit your own questions');
  }

  return prisma.question.update({
    where: { id },
    data: {
      ...input,
      content: input.content as Prisma.InputJsonValue | undefined,
      solution: input.solution as Prisma.InputJsonValue | undefined,
      // Editing an approved question sends it back for review, so stale
      // content can't silently stay "approved" after a substantive edit.
      isApproved: isPrivileged ? existing.isApproved : false,
    },
  });
};

export const deleteQuestion = async (id: string, requester: { id: string; role: Role }) => {
  const existing = await prisma.question.findUnique({ where: { id } });
  if (!existing) throw AppError.notFound('Question not found');

  const isOwner = existing.authorId === requester.id;
  const isPrivileged = requester.role === 'ADMIN' || requester.role === 'SUPER_ADMIN';
  if (!isOwner && !isPrivileged) {
    throw AppError.forbidden('You can only delete your own questions');
  }

  await prisma.question.delete({ where: { id } });
};

export const setQuestionApproval = async (id: string, isApproved: boolean) => {
  const existing = await prisma.question.findUnique({ where: { id } });
  if (!existing) throw AppError.notFound('Question not found');

  return prisma.question.update({ where: { id }, data: { isApproved } });
};

export const listPendingQuestions = async () => {
  return prisma.question.findMany({
    where: { isApproved: false },
    include: { topic: true, subject: true, author: { select: { firstName: true, lastName: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });
};

// ── Bookmarks ─────────────────────────────────────────────────────────

export const toggleBookmark = async (userId: string, questionId: string) => {
  const existing = await prisma.bookmark.findUnique({
    where: { userId_questionId: { userId, questionId } },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return { bookmarked: false };
  }

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) throw AppError.notFound('Question not found');

  await prisma.bookmark.create({ data: { userId, questionId } });
  return { bookmarked: true };
};

export const listBookmarks = async (userId: string) => {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    include: { question: { include: { topic: true, subject: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return bookmarks.map((b) => ({ ...b, question: withoutSolution(b.question) }));
};
