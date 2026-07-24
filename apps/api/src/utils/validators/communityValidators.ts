import { z } from 'zod';

export const createThreadSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(200),
  body: z.string().trim().min(10, 'Body must be at least 10 characters').max(10000),
  subjectId: z.string().uuid().optional(),
});

export const createPostSchema = z.object({
  body: z.string().trim().min(1, 'Reply cannot be empty').max(10000),
});

export const listThreadsQuerySchema = z.object({
  subject: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const sendMessageSchema = z.object({
  recipientId: z.string().uuid(),
  body: z.string().trim().min(1, 'Message cannot be empty').max(5000),
});

export const createBlogPostSchema = z.object({
  title: z.string().trim().min(5).max(200),
  excerpt: z.string().trim().min(10).max(500),
  content: z.string().trim().min(20),
  coverImageUrl: z.string().url().optional(),
});

export const updateBlogPostSchema = createBlogPostSchema.partial().extend({
  isPublished: z.boolean().optional(),
});

export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export type ListThreadsQuery = z.infer<typeof listThreadsQuerySchema>;
