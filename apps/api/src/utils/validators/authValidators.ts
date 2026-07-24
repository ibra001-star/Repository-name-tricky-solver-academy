import { z } from 'zod';

export const registerSchema = z.object({
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters').max(50),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  phone: z.string().trim().optional(),
  role: z.enum(['STUDENT', 'TEACHER']).default('STUDENT'),
  referralCode: z.string().trim().toUpperCase().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  twoFactorCode: z.string().length(6).optional(),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'Google ID token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export const enable2faSchema = z.object({
  code: z.string().length(6, 'Enter the 6-digit code from your authenticator app'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
