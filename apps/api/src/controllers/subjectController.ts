import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { prisma } from '../config/prisma';

export const listSubjects = asyncHandler(async (_req: Request, res: Response) => {
  const subjects = await prisma.subject.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { questions: true, exams: true } },
    },
  });
  res.status(200).json({ success: true, data: { subjects } });
});

export const getSubjectBySlug = asyncHandler(async (req: Request, res: Response) => {
  const subject = await prisma.subject.findUnique({
    where: { slug: req.params.slug },
    include: {
      topics: {
        where: { parentId: null },
        include: { subtopics: true },
        orderBy: { name: 'asc' },
      },
    },
  });

  if (!subject) {
    res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Subject not found' });
    return;
  }

  res.status(200).json({ success: true, data: { subject } });
});
