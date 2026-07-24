import { UploadStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { uploadBuffer } from './uploadService';

const fileTypeFromMimetype = (mimetype: string): string => {
  if (mimetype === 'application/pdf') return 'pdf';
  return 'docx';
};

export const createTeacherUpload = async (
  teacherId: string,
  input: { title: string; subjectArea: string },
  file: Express.Multer.File
) => {
  const result = await uploadBuffer(file.buffer, { folder: 'teacher-uploads', resourceType: 'raw' });

  return prisma.teacherUpload.create({
    data: {
      teacherId,
      title: input.title,
      subjectArea: input.subjectArea,
      fileUrl: result.url,
      fileType: fileTypeFromMimetype(file.mimetype),
    },
  });
};

export const listMyUploads = async (teacherId: string) => {
  return prisma.teacherUpload.findMany({
    where: { teacherId },
    orderBy: { createdAt: 'desc' },
  });
};

export const listPendingUploads = async () => {
  return prisma.teacherUpload.findMany({
    where: { status: 'PENDING_REVIEW' },
    include: { teacher: { select: { firstName: true, lastName: true, email: true, school: true } } },
    orderBy: { createdAt: 'asc' },
  });
};

export const reviewUpload = async (
  uploadId: string,
  decision: { status: 'APPROVED' | 'REJECTED'; reviewNotes?: string }
) => {
  const upload = await prisma.teacherUpload.findUnique({ where: { id: uploadId } });
  if (!upload) throw AppError.notFound('Upload not found');
  if (upload.status !== 'PENDING_REVIEW') {
    throw AppError.badRequest('This upload has already been reviewed');
  }

  const updated = await prisma.teacherUpload.update({
    where: { id: uploadId },
    data: {
      status: decision.status as UploadStatus,
      reviewNotes: decision.reviewNotes,
      reviewedAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      userId: upload.teacherId,
      title: decision.status === 'APPROVED' ? 'Upload approved' : 'Upload rejected',
      message:
        decision.status === 'APPROVED'
          ? `Your upload "${upload.title}" has been approved and is now visible to students.`
          : `Your upload "${upload.title}" was not approved.${decision.reviewNotes ? ` Reason: ${decision.reviewNotes}` : ''}`,
      type: 'in_app',
    },
  });

  return updated;
};

export const deleteUpload = async (uploadId: string, requester: { id: string; role: string }) => {
  const upload = await prisma.teacherUpload.findUnique({ where: { id: uploadId } });
  if (!upload) throw AppError.notFound('Upload not found');

  const isOwner = upload.teacherId === requester.id;
  const isPrivileged = requester.role === 'ADMIN' || requester.role === 'SUPER_ADMIN';
  if (!isOwner && !isPrivileged) throw AppError.forbidden('You can only delete your own uploads');

  await prisma.teacherUpload.delete({ where: { id: uploadId } });
};

// Public-facing listing of approved uploads, so students can actually browse
// teacher-contributed revision material once it clears review.
export const listApprovedUploads = async (subjectArea?: string) => {
  return prisma.teacherUpload.findMany({
    where: { status: 'APPROVED', ...(subjectArea ? { subjectArea } : {}) },
    include: { teacher: { select: { firstName: true, lastName: true } } },
    orderBy: { reviewedAt: 'desc' },
  });
};
