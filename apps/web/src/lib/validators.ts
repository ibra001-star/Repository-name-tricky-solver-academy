import { z } from 'zod';

export const registerFormSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Include at least one uppercase letter')
      .regex(/[a-z]/, 'Include at least one lowercase letter')
      .regex(/[0-9]/, 'Include at least one number'),
    confirmPassword: z.string(),
    role: z.enum(['STUDENT', 'TEACHER']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const loginFormSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  twoFactorCode: z.string().optional(),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
