import { z } from 'zod';

// Restrict joinUrl to known, expected domains per type — this is a small
// but real safety net: without it, "joinUrl" is an arbitrary link an admin
// or teacher could paste, which the frontend would then render as a
// one-click "Join now" button for students. Scoping it to Zoom/YouTube
// domains means the feature can't be repurposed to redirect students
// anywhere else.
const zoomUrlSchema = z
  .string()
  .url()
  .refine((url) => /^https:\/\/([\w-]+\.)?zoom\.us\//.test(url), 'Must be a valid Zoom URL (zoom.us)');

const youtubeUrlSchema = z
  .string()
  .url()
  .refine(
    (url) => /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/.test(url),
    'Must be a valid YouTube URL'
  );

export const createLiveClassSchema = z
  .object({
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().max(2000).optional(),
    type: z.enum(['ZOOM', 'YOUTUBE']),
    subjectId: z.string().uuid().optional(),
    joinUrl: z.string().url(),
    scheduledStart: z.string().datetime().optional(),
    durationMinutes: z.number().int().min(5).max(480).optional(),
  })
  .superRefine((data, ctx) => {
    const validator = data.type === 'ZOOM' ? zoomUrlSchema : youtubeUrlSchema;
    const result = validator.safeParse(data.joinUrl);
    if (!result.success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['joinUrl'], message: result.error.issues[0].message });
    }
  });

export const updateLiveClassSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  scheduledStart: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  isPublished: z.boolean().optional(),
});

export const createStudyPlanItemSchema = z.object({
  title: z.string().trim().min(2).max(200),
  subjectId: z.string().uuid().optional(),
  scheduledFor: z.string().datetime(),
  notes: z.string().trim().max(1000).optional(),
});

export const updateStudyPlanItemSchema = createStudyPlanItemSchema.partial().extend({
  isCompleted: z.boolean().optional(),
});

export const subscribeNewsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});

export type CreateLiveClassInput = z.infer<typeof createLiveClassSchema>;
export type CreateStudyPlanItemInput = z.infer<typeof createStudyPlanItemSchema>;
