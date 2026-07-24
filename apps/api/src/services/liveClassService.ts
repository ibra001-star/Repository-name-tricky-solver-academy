import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { CreateLiveClassInput } from '../utils/validators/scheduleValidators';

export const listUpcoming = async (subjectSlug?: string) => {
  return prisma.liveClass.findMany({
    where: {
      isPublished: true,
      ...(subjectSlug ? { subject: { slug: subjectSlug } } : {}),
    },
    include: { subject: true, host: { select: { firstName: true, lastName: true } } },
    orderBy: { scheduledStart: 'asc' },
  });
};

export const listAllForStaff = async () => {
  return prisma.liveClass.findMany({
    include: { subject: true, host: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

export const createLiveClass = async (hostId: string, input: CreateLiveClassInput) => {
  if (input.subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: input.subjectId } });
    if (!subject) throw AppError.badRequest('Subject not found');
  }

  return prisma.liveClass.create({
    data: {
      title: input.title,
      description: input.description,
      type: input.type,
      subjectId: input.subjectId,
      joinUrl: input.joinUrl,
      scheduledStart: input.scheduledStart ? new Date(input.scheduledStart) : undefined,
      durationMinutes: input.durationMinutes,
      hostId,
    },
    include: { subject: true },
  });
};

export const updateLiveClass = async (
  id: string,
  input: Partial<{
    title: string;
    description: string;
    scheduledStart: string;
    durationMinutes: number;
    isPublished: boolean;
  }>,
  requester: { id: string; role: string }
) => {
  const liveClass = await prisma.liveClass.findUnique({ where: { id } });
  if (!liveClass) throw AppError.notFound('Live class not found');

  const isOwner = liveClass.hostId === requester.id;
  const isPrivileged = requester.role === 'ADMIN' || requester.role === 'SUPER_ADMIN';
  if (!isOwner && !isPrivileged) throw AppError.forbidden('You can only edit sessions you created');

  const { scheduledStart, ...rest } = input;
  return prisma.liveClass.update({
    where: { id },
    data: { ...rest, scheduledStart: scheduledStart ? new Date(scheduledStart) : undefined },
  });
};

export const deleteLiveClass = async (id: string, requester: { id: string; role: string }) => {
  const liveClass = await prisma.liveClass.findUnique({ where: { id } });
  if (!liveClass) throw AppError.notFound('Live class not found');

  const isOwner = liveClass.hostId === requester.id;
  const isPrivileged = requester.role === 'ADMIN' || requester.role === 'SUPER_ADMIN';
  if (!isOwner && !isPrivileged) throw AppError.forbidden('You can only delete sessions you created');

  await prisma.liveClass.delete({ where: { id } });
};
