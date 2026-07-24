import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { CreateStudyPlanItemInput } from '../utils/validators/scheduleValidators';

export const listMyPlanItems = async (userId: string, from?: string, to?: string) => {
  return prisma.studyPlanItem.findMany({
    where: {
      userId,
      ...(from || to
        ? {
            scheduledFor: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: { subject: true },
    orderBy: { scheduledFor: 'asc' },
  });
};

export const createPlanItem = async (userId: string, input: CreateStudyPlanItemInput) => {
  if (input.subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: input.subjectId } });
    if (!subject) throw AppError.badRequest('Subject not found');
  }

  return prisma.studyPlanItem.create({
    data: {
      userId,
      title: input.title,
      subjectId: input.subjectId,
      scheduledFor: new Date(input.scheduledFor),
      notes: input.notes,
    },
    include: { subject: true },
  });
};

export const updatePlanItem = async (
  itemId: string,
  userId: string,
  input: Partial<{ title: string; subjectId: string; scheduledFor: string; notes: string; isCompleted: boolean }>
) => {
  const item = await prisma.studyPlanItem.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== userId) throw AppError.notFound('Study plan item not found');

  const { scheduledFor, ...rest } = input;
  return prisma.studyPlanItem.update({
    where: { id: itemId },
    data: { ...rest, scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined },
  });
};

export const deletePlanItem = async (itemId: string, userId: string) => {
  const item = await prisma.studyPlanItem.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== userId) throw AppError.notFound('Study plan item not found');

  await prisma.studyPlanItem.delete({ where: { id: itemId } });
};
