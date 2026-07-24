import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Validating env vars at boot means the app refuses to start with a
// misconfigured secret rather than failing unpredictably at 2am in production.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY_DAYS: z.coerce.number().default(30),

  CLIENT_URL: z.string().default('http://localhost:3000'),

  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),

  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM: z.string().optional().default('Tricky Solver Academy <no-reply@trickysolver.academy>'),

  MPESA_CONSUMER_KEY: z.string().optional().default(''),
  MPESA_CONSUMER_SECRET: z.string().optional().default(''),
  MPESA_SHORTCODE: z.string().optional().default(''),
  MPESA_PASSKEY: z.string().optional().default(''),
  MPESA_CALLBACK_URL: z.string().optional().default(''),
  MPESA_ENV: z.enum(['sandbox', 'production']).default('sandbox'),

  STRIPE_SECRET_KEY: z.string().optional().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(''),

  PAYPAL_CLIENT_ID: z.string().optional().default(''),
  PAYPAL_CLIENT_SECRET: z.string().optional().default(''),
  PAYPAL_WEBHOOK_ID: z.string().optional().default(''),
  PAYPAL_ENV: z.enum(['sandbox', 'production']).default('sandbox'),

  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),

  AFRICASTALKING_API_KEY: z.string().optional().default(''),
  AFRICASTALKING_USERNAME: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment configuration:');
  // eslint-disable-next-line no-console
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
