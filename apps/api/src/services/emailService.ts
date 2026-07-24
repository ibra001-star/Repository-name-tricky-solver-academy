import nodemailer from 'nodemailer';
import { env, isProduction } from '../config/env';
import { logger } from '../config/logger';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || 'localhost',
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
});

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
}

// In development without SMTP configured, emails are logged instead of sent
// so the auth flow (verification links, reset links) can still be tested locally.
export const sendEmail = async ({ to, subject, html }: SendEmailArgs): Promise<void> => {
  if (!env.SMTP_HOST) {
    logger.info({ to, subject, html }, '📧 [DEV EMAIL — not sent, no SMTP configured]');
    return;
  }

  try {
    await transporter.sendMail({ from: env.SMTP_FROM, to, subject, html });
  } catch (err) {
    logger.error({ err, to, subject }, 'Failed to send email');
    if (isProduction) throw err;
  }
};

export const sendVerificationEmail = async (to: string, name: string, verifyUrl: string) => {
  await sendEmail({
    to,
    subject: 'Verify your Tricky Solver Academy account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1e3a8a;">Welcome to Tricky Solver Academy, ${name}!</h2>
        <p>Please verify your email address to activate your account.</p>
        <a href="${verifyUrl}" style="display:inline-block;background:#d4af37;color:#1e3a8a;font-weight:bold;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">Verify Email</a>
        <p style="color:#666;font-size:14px;">If you didn't create this account, you can safely ignore this email.</p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (to: string, name: string, resetUrl: string) => {
  await sendEmail({
    to,
    subject: 'Reset your Tricky Solver Academy password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1e3a8a;">Hi ${name},</h2>
        <p>We received a request to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#1e3a8a;color:#fff;font-weight:bold;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">Reset Password</a>
        <p style="color:#666;font-size:14px;">If you didn't request this, you can safely ignore this email — your password will not change.</p>
      </div>
    `,
  });
};
