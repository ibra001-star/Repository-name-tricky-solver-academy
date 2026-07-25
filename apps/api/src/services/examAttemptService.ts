import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { canAccessExam } from './accessControlService';

interface QuestionContent {
  text: string;
  options?: Array<{ id: string; text: string; isCorrect: boolean }>;
  blanks?: string[];
  matchPairs?: Array<{ left: string; right: string }>;
}

// Marks a single answer against its question's stored solution/content.
// Only objective question types (multiple choice, fill-in-blank, matching)
// can be marked instantly; structured/essay/calculation questions are
// scored 0 here and flagged for manual/AI-assisted review in a later phase.
const markAnswer = (
  type: string,
  content: QuestionContent,
  marks: number,
  response: unknown,
  negativeMarking: boolean
): { awarded: number; isCorrect: boolean | null } => {
  switch (type) {
    case 'MULTIPLE_CHOICE': {
      const options = content.options ?? [];
      const correct = options.find((o) => o.isCorrect);
      const selectedId = typeof response === 'string' ? response : undefined;
      const isCorrect = !!correct && selectedId === correct.id;
      if (isCorrect) return { awarded: marks, isCorrect: true };
      if (selectedId && negativeMarking) return { awarded: -Math.ceil(marks / 4), isCorrect: false };
      return { awarded: 0, isCorrect: selectedId ? false : null };
    }
    case 'FILL_IN_BLANK': {
      const blanks = content.blanks ?? [];
      const answers = Array.isArray(response) ? (response as string[]) : [];
      if (blanks.length === 0) return { awarded: 0, isCorrect: null };
      const correctCount = blanks.filter(
        (b, i) => (answers[i] ?? '').trim().toLowerCase() === b.trim().toLowerCase()
      ).length;
      const awarded = Math.round((correctCount / blanks.length) * marks);
      return { awarded, isCorrect: correctCount === blanks.length };
    }
    case 'MATCHING': {
      const pairs = content.matchPairs ?? [];
      const answers = (response ?? {}) as Record<string, string>;
      if (pairs.length === 0) return { awarded: 0, isCorrect: null };
      const correctCount = pairs.filter((p) => answers[p.left] === p.right).length;
      const awarded = Math.round((correctCount / pairs.length) * marks);
      return { awarded, isCorrect: correctCount === pairs.length };
    }
    default:
      // STRUCTURED, ESSAY, CALCULATION, GRAPH, IMAGE_BASED require human or
      // AI-assisted marking — left ungraded (null) for a teacher to review.
      return { awarded: 0, isCorrect: null };
  }
};

export const startAttempt = async (examId: string, userId: string) => {
  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam || !exam.isPublished) throw AppError.notFound('Exam not found');

  const hasAccess = await canAccessExam(userId, exam);
  if (!hasAccess) {
    throw AppError.paymentRequired('This is a premium paper. Subscribe or purchase it to unlock full access.');
  }

  // Resume-in-progress: if an unfinished attempt already exists, return it
  // instead of creating a duplicate, so refreshing the page doesn't reset the timer.
  const existing = await prisma.examAttempt.findFirst({
    where: { examId, userId, status: 'IN_PROGRESS' },
  });
  if (existing) return existing;

  return prisma.examAttempt.create({
    data: { examId, userId, totalMarks: exam.totalMarks },
  });
};

export const getAttempt = async (attemptId: string, userId: string) => {
  const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== userId) throw AppError.notFound('Attempt not found');
  return attempt;
};

// Autosave: called periodically (e.g. every 15-30s) by the exam-taking UI.
// Merges the new answer into the JSON `answers` blob without touching
// anything else, and stamps it so we can show "Saved just now" in the UI.
export const autosaveAnswer = async (attemptId: string, userId: string, questionId: string, response: unknown) => {
  const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== userId) throw AppError.notFound('Attempt not found');
  if (attempt.status !== 'IN_PROGRESS') throw AppError.badRequest('This attempt has already been submitted');

  const currentAnswers = (attempt.answers as Record<string, unknown>) ?? {};
  const updatedAnswers = {
    ...currentAnswers,
    [questionId]: { response, autoSavedAt: new Date().toISOString() },
  };

  return prisma.examAttempt.update({
    where: { id: attemptId },
    data: { answers: updatedAnswers as Prisma.InputJsonValue },
  });
};

export const submitAttempt = async (
  attemptId: string,
  userId: string,
  finalAnswers?: Record<string, unknown>
) => {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: { exam: { include: { examQuestions: { include: { question: true } } } } },
  });

  if (!attempt || attempt.userId !== userId) throw AppError.notFound('Attempt not found');
  if (attempt.status !== 'IN_PROGRESS') throw AppError.badRequest('This attempt has already been submitted');

  const savedAnswers = (attempt.answers as Record<string, { response: unknown }>) ?? {};
  // Allow a final batch of answers to be included in the submit call itself
  // (covers the "submit before the last autosave fires" race).
  const mergedAnswers: Record<string, { response: unknown }> = { ...savedAnswers };
  if (finalAnswers) {
    for (const [qId, response] of Object.entries(finalAnswers)) {
      mergedAnswers[qId] = { response };
    }
  }

  let totalAwarded = 0;
  let hasUngraded = false;

  const gradedAnswers: Record<string, { response: unknown; awarded: number; isCorrect: boolean | null }> = {};

  for (const { question } of attempt.exam.examQuestions) {
    const entry = mergedAnswers[question.id];
    const response = entry?.response;
    const { awarded, isCorrect } = markAnswer(
      question.type,
      question.content as unknown as QuestionContent,
      question.marks,
      response,
      attempt.exam.negativeMarking
    );
    if (isCorrect === null && response !== undefined) hasUngraded = true;
    totalAwarded += awarded;
    gradedAnswers[question.id] = { response, awarded, isCorrect };
  }

  // Marks never go negative overall even with negative marking enabled.
  totalAwarded = Math.max(0, totalAwarded);
  const percentage = attempt.exam.totalMarks > 0 ? (totalAwarded / attempt.exam.totalMarks) * 100 : 0;

  return prisma.examAttempt.update({
    where: { id: attemptId },
    data: {
      answers: gradedAnswers as Prisma.InputJsonValue,
      status: hasUngraded ? 'SUBMITTED' : 'MARKED',
      score: totalAwarded,
      percentage: Math.round(percentage * 100) / 100,
      submittedAt: new Date(),
      markedAt: hasUngraded ? null : new Date(),
    },
  });
};

// Full result view: exam questions + the student's answers + correct
// answers/solutions, shown only after submission.
export const getAttemptResult = async (attemptId: string, userId: string) => {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: {
        include: {
          subject: true,
          examQuestions: { orderBy: { order: 'asc' }, include: { question: true } },
        },
      },
    },
  });

  if (!attempt || attempt.userId !== userId) throw AppError.notFound('Attempt not found');
  if (attempt.status === 'IN_PROGRESS') throw AppError.badRequest('This attempt has not been submitted yet');

  const gradedAnswers =
    (attempt.answers as Record<string, { response: unknown; awarded: number; isCorrect: boolean | null }>) ?? {};

  const questions = attempt.exam.examQuestions.map(({ question, order }) => ({
    id: question.id,
    order,
    type: question.type,
    marks: question.marks,
    content: question.content,
    solution: question.solution,
    studentAnswer: gradedAnswers[question.id]?.response ?? null,
    awarded: gradedAnswers[question.id]?.awarded ?? 0,
    isCorrect: gradedAnswers[question.id]?.isCorrect ?? null,
  }));

  return {
    id: attempt.id,
    status: attempt.status,
    score: attempt.score,
    totalMarks: attempt.totalMarks,
    percentage: attempt.percentage,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    exam: { id: attempt.exam.id, title: attempt.exam.title, subject: attempt.exam.subject },
    questions,
  };
};

export const listMyAttempts = async (userId: string) => {
  return prisma.examAttempt.findMany({
    where: { userId },
    include: { exam: { include: { subject: true } } },
    orderBy: { startedAt: 'desc' },
  });
};

// Leaderboard: top scores for a given exam among MARKED attempts.
export const getExamLeaderboard = async (examId: string, limit = 20) => {
  const attempts = await prisma.examAttempt.findMany({
    where: { examId, status: 'MARKED' },
    include: { user: { select: { firstName: true, lastName: true, school: true } } },
    orderBy: [{ percentage: 'desc' }, { submittedAt: 'asc' }],
    take: limit,
  });

  return attempts.map((a, index) => ({
    rank: index + 1,
    name: `${a.user.firstName} ${a.user.lastName.charAt(0)}.`,
    school: a.user.school,
    score: a.score,
    percentage: a.percentage,
    submittedAt: a.submittedAt,
  }));
};

const MIN_ATTEMPTS_FOR_PLATFORM_LEADERBOARD = 3;

// Platform-wide ranking across every exam, not just one. Requires a minimum
// number of marked attempts before a student is ranked at all — otherwise a
// single lucky 100% on one easy topical quiz would outrank a student who has
// consistently scored well across dozens of exams, which would make the
// leaderboard meaningless (and easy to game) as a signal of real ability.
export const getPlatformLeaderboard = async (limit = 50) => {
  const grouped = await prisma.examAttempt.groupBy({
    by: ['userId'],
    where: { status: 'MARKED' },
    _avg: { percentage: true },
    _count: { _all: true },
    having: { userId: { _count: { gte: MIN_ATTEMPTS_FOR_PLATFORM_LEADERBOARD } } },
  });

  const ranked = grouped
    .filter((g) => g._avg.percentage !== null)
    .sort((a, b) => (b._avg.percentage ?? 0) - (a._avg.percentage ?? 0))
    .slice(0, limit);

  const users = await prisma.user.findMany({
    where: { id: { in: ranked.map((r) => r.userId) } },
    select: { id: true, firstName: true, lastName: true, school: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return ranked.map((r, index) => {
    const user = userMap.get(r.userId);
    return {
      rank: index + 1,
      name: user ? `${user.firstName} ${user.lastName.charAt(0)}.` : 'Unknown',
      school: user?.school ?? null,
      averagePercentage: Math.round((r._avg.percentage ?? 0) * 100) / 100,
      examsCompleted: r._count._all,
    };
  });
};
