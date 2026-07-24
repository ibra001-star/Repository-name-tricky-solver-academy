import { z } from 'zod';

export const createExamSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  subjectId: z.string().uuid(),
  examType: z.enum([
    'TOPICAL',
    'CAT',
    'MIDTERM',
    'END_TERM',
    'KCSE_MOCK',
    'KCSE_PREDICTION',
    'CBC_ASSESSMENT',
    'HOLIDAY_ASSIGNMENT',
    'PAST_PAPER',
  ]),
  curriculum: z.enum(['CBC', 'KCSE']).default('KCSE'),
  form: z.number().int().min(1).max(4).optional(),
  durationMinutes: z.number().int().min(5).max(600),
  negativeMarking: z.boolean().default(false),
  randomizeOrder: z.boolean().default(false),
  isPremium: z.boolean().default(false),
  priceKes: z.number().int().min(0).default(0),
  scheduledStart: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
  questionIds: z.array(z.string().uuid()).min(1, 'An exam needs at least one question'),
});

export const updateExamSchema = createExamSchema.partial();

export const publishExamSchema = z.object({
  isPublished: z.boolean(),
});

export const listExamsQuerySchema = z.object({
  subject: z.string().optional(),
  examType: z.string().optional(),
  curriculum: z.string().optional(),
  form: z.coerce.number().int().min(1).max(4).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Answers submitted during an attempt: { [questionId]: response }
// `response` shape depends on question type (string, string[], {left,right}[], etc.)
// so we validate it loosely here and let the marking engine interpret it per-type.
export const saveAnswerSchema = z.object({
  questionId: z.string().uuid(),
  response: z.unknown(),
});

export const submitAttemptSchema = z.object({
  answers: z.record(z.string().uuid(), z.unknown()).optional(),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;
export type ListExamsQuery = z.infer<typeof listExamsQuerySchema>;
