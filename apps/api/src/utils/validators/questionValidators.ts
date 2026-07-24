import { z } from 'zod';

// Content/solution are stored as JSON on the Question model. We validate
// their shape at the API boundary even though Prisma stores them as Json,
// so malformed content never reaches the database or the exam-taking UI.
const questionOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  isCorrect: z.boolean(),
});

const matchPairSchema = z.object({
  left: z.string().min(1),
  right: z.string().min(1),
});

const questionContentSchema = z.object({
  text: z.string().min(1, 'Question text is required'),
  latex: z.string().optional(),
  imageUrls: z.array(z.string().url()).optional(),
  options: z.array(questionOptionSchema).optional(),
  blanks: z.array(z.string()).optional(),
  matchPairs: z.array(matchPairSchema).optional(),
});

const questionSolutionSchema = z.object({
  steps: z.array(z.string()).default([]),
  finalAnswer: z.string().min(1, 'Final answer is required'),
  markingScheme: z.string().optional(),
  explanationLatex: z.string().optional(),
});

export const createQuestionSchema = z.object({
  subjectId: z.string().uuid(),
  topicId: z.string().uuid(),
  type: z.enum([
    'MULTIPLE_CHOICE',
    'STRUCTURED',
    'FILL_IN_BLANK',
    'MATCHING',
    'ESSAY',
    'CALCULATION',
    'GRAPH',
    'IMAGE_BASED',
  ]),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  curriculum: z.enum(['CBC', 'KCSE']).default('KCSE'),
  form: z.number().int().min(1).max(4).optional(),
  year: z.number().int().min(1990).max(2100).optional(),
  publisher: z.string().optional(),
  tags: z.array(z.string()).default([]),
  content: questionContentSchema,
  solution: questionSolutionSchema,
  marks: z.number().int().min(1).max(100).default(1),
});

export const updateQuestionSchema = createQuestionSchema.partial();

export const approveQuestionSchema = z.object({
  isApproved: z.boolean(),
});

export const listQuestionsQuerySchema = z.object({
  subject: z.string().optional(),
  topic: z.string().optional(),
  type: z.string().optional(),
  difficulty: z.string().optional(),
  curriculum: z.string().optional(),
  form: z.coerce.number().int().min(1).max(4).optional(),
  year: z.coerce.number().int().optional(),
  tags: z.string().optional(), // comma-separated
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  random: z.coerce.boolean().optional(),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type ListQuestionsQuery = z.infer<typeof listQuestionsQuerySchema>;
