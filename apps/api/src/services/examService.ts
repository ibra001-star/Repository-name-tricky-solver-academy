import { Prisma, Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { CreateExamInput, ListExamsQuery } from '../utils/validators/examValidators';
import { canAccessExam } from './accessControlService';

export const listExams = async (query: ListExamsQuery, requester: { id: string; role: Role } | null) => {
  const isStaff = requester && ['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(requester.role);

  const where: Prisma.ExamWhereInput = isStaff ? {} : { isPublished: true };

  if (query.subject) where.subject = { slug: query.subject };
  if (query.examType) where.examType = query.examType as Prisma.ExamWhereInput['examType'];
  if (query.curriculum) where.curriculum = query.curriculum as Prisma.ExamWhereInput['curriculum'];
  if (query.form) where.form = query.form;

  const skip = (query.page - 1) * query.limit;

  const [exams, total] = await Promise.all([
    prisma.exam.findMany({
      where,
      include: {
        subject: true,
        _count: { select: { examQuestions: true, attempts: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
    }),
    prisma.exam.count({ where }),
  ]);

  return {
    exams,
    pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
  };
};

// Returns exam metadata + question list WITHOUT solutions or correct-answer
// flags — this is what the exam-taking UI fetches when a student starts an
// attempt. Solutions are only revealed after submission via getAttemptResult.
export const getExamForTaking = async (examId: string, userId: string | null) => {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      subject: true,
      examQuestions: {
        orderBy: { order: 'asc' },
        include: { question: true },
      },
    },
  });

  if (!exam || !exam.isPublished) throw AppError.notFound('Exam not found');

  const hasAccess = await canAccessExam(userId, exam);
  if (!hasAccess) {
    throw AppError.paymentRequired('This is a premium paper. Subscribe or purchase it to unlock full access.');
  }

  const questions = exam.examQuestions.map(({ question, order }) => {
    const content = question.content as Record<string, unknown>;
    // Strip isCorrect flags from multiple-choice options so the client
    // never receives the answer key before submission.
    const sanitizedOptions = Array.isArray(content.options)
      ? (content.options as Array<Record<string, unknown>>).map((opt) => ({ id: opt.id, text: opt.text }))
      : undefined;

    return {
      id: question.id,
      order,
      type: question.type,
      marks: question.marks,
      difficulty: question.difficulty,
      content: { ...content, options: sanitizedOptions },
    };
  });

  const orderedQuestions = exam.randomizeOrder ? shuffle(questions) : questions;

  return {
    id: exam.id,
    title: exam.title,
    description: exam.description,
    subject: exam.subject,
    examType: exam.examType,
    durationMinutes: exam.durationMinutes,
    totalMarks: exam.totalMarks,
    negativeMarking: exam.negativeMarking,
    questions: orderedQuestions,
  };
};

const shuffle = <T>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const createExam = async (input: CreateExamInput, createdById: string) => {
  const subject = await prisma.subject.findUnique({ where: { id: input.subjectId } });
  if (!subject) throw AppError.badRequest('Subject not found');

  const questions = await prisma.question.findMany({ where: { id: { in: input.questionIds } } });
  if (questions.length !== input.questionIds.length) {
    throw AppError.badRequest('One or more selected questions do not exist');
  }

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  const { questionIds, scheduledStart, scheduledEnd, ...examFields } = input;

  return prisma.exam.create({
    data: {
      ...examFields,
      scheduledStart: scheduledStart ? new Date(scheduledStart) : undefined,
      scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : undefined,
      totalMarks,
      createdById,
      examQuestions: {
        create: questionIds.map((questionId, index) => ({ questionId, order: index })),
      },
    },
    include: { examQuestions: { include: { question: true } }, subject: true },
  });
};

export const updateExam = async (
  examId: string,
  input: Partial<CreateExamInput>,
  requester: { id: string; role: Role }
) => {
  const existing = await prisma.exam.findUnique({ where: { id: examId } });
  if (!existing) throw AppError.notFound('Exam not found');

  const isOwner = existing.createdById === requester.id;
  const isPrivileged = requester.role === 'ADMIN' || requester.role === 'SUPER_ADMIN';
  if (!isOwner && !isPrivileged) throw AppError.forbidden('You can only edit exams you created');

  const { questionIds, scheduledStart, scheduledEnd, ...examFields } = input;

  let totalMarks: number | undefined;
  if (questionIds) {
    const questions = await prisma.question.findMany({ where: { id: { in: questionIds } } });
    if (questions.length !== questionIds.length) {
      throw AppError.badRequest('One or more selected questions do not exist');
    }
    totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
  }

  return prisma.$transaction(async (tx) => {
    if (questionIds) {
      await tx.examQuestion.deleteMany({ where: { examId } });
      await tx.examQuestion.createMany({
        data: questionIds.map((questionId, index) => ({ examId, questionId, order: index })),
      });
    }

    return tx.exam.update({
      where: { id: examId },
      data: {
        ...examFields,
        scheduledStart: scheduledStart ? new Date(scheduledStart) : undefined,
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : undefined,
        ...(totalMarks !== undefined ? { totalMarks } : {}),
      },
      include: { examQuestions: { include: { question: true } }, subject: true },
    });
  });
};

export const setExamPublished = async (examId: string, isPublished: boolean) => {
  const existing = await prisma.exam.findUnique({ where: { id: examId } });
  if (!existing) throw AppError.notFound('Exam not found');
  return prisma.exam.update({ where: { id: examId }, data: { isPublished } });
};

export const deleteExam = async (examId: string, requester: { id: string; role: Role }) => {
  const existing = await prisma.exam.findUnique({ where: { id: examId } });
  if (!existing) throw AppError.notFound('Exam not found');

  const isOwner = existing.createdById === requester.id;
  const isPrivileged = requester.role === 'ADMIN' || requester.role === 'SUPER_ADMIN';
  if (!isOwner && !isPrivileged) throw AppError.forbidden('You can only delete exams you created');

  await prisma.exam.delete({ where: { id: examId } });
};
