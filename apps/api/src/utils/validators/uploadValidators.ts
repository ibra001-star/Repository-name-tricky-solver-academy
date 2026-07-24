import { z } from 'zod';

export const createUploadMetaSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
  subjectArea: z.string().trim().min(2, 'Subject area is required').max(100),
});

export const reviewUploadSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNotes: z.string().trim().max(1000).optional(),
});

export type CreateUploadMetaInput = z.infer<typeof createUploadMetaSchema>;
