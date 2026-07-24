import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  role: z.enum(['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN']).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const setUserActiveSchema = z.object({
  isActive: z.boolean(),
});

export const setUserRoleSchema = z.object({
  role: z.enum(['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN']),
});

export const listAuditLogsQuerySchema = z.object({
  action: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
