import { randomBytes } from 'crypto';
import { authenticator } from 'otplib';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { hashPassword, verifyPassword } from '../utils/password';
import { signAccessToken } from '../utils/jwt';
import { issueRefreshToken } from './tokenService';
import { sendPasswordResetEmail, sendVerificationEmail } from './emailService';
import { recordReferral } from './referralService';
import { RegisterInput, LoginInput } from '../utils/validators/authValidators';
import { Role } from '@prisma/client';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const publicUser = (u: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  profilePictureUrl: string | null;
  isEmailVerified: boolean;
  isTwoFactorEnabled: boolean;
}) => ({
  id: u.id,
  email: u.email,
  firstName: u.firstName,
  lastName: u.lastName,
  role: u.role,
  profilePictureUrl: u.profilePictureUrl,
  isEmailVerified: u.isEmailVerified,
  isTwoFactorEnabled: u.isTwoFactorEnabled,
});

interface SessionMeta {
  userAgent?: string;
  ipAddress?: string;
}

const buildSession = async (userId: string, role: Role, email: string, meta: SessionMeta) => {
  const accessToken = signAccessToken({ sub: userId, role, email });
  const refreshToken = await issueRefreshToken(userId, meta);
  return { accessToken, refreshToken };
};

export const registerUser = async (input: RegisterInput, meta: SessionMeta) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw AppError.conflict('An account with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      role: input.role,
    },
  });

  // Fire off email verification token + email (best-effort; does not block registration)
  const token = randomBytes(32).toString('hex');
  await prisma.emailVerificationToken.create({
    data: { token, userId: user.id, expiresAt: new Date(Date.now() + DAY_MS) },
  });
  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;
  void sendVerificationEmail(user.email, user.firstName, verifyUrl);

  // Best-effort referral recording — an invalid/missing code never blocks
  // registration, since the referral program is a growth nice-to-have, not
  // a core account-creation requirement.
  if (input.referralCode) {
    void recordReferral(input.referralCode, user.id).catch(() => {});
  }

  const session = await buildSession(user.id, user.role, user.email, meta);

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'REGISTER', entity: 'User', entityId: user.id, ipAddress: meta.ipAddress },
  });

  return { user: publicUser(user), ...session };
};

export const loginUser = async (input: LoginInput, meta: SessionMeta) => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Uniform error message whether the email doesn't exist or the password is
  // wrong — prevents user enumeration attacks.
  if (!user || !user.passwordHash) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const validPassword = await verifyPassword(user.passwordHash, input.password);
  if (!validPassword) {
    throw AppError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw AppError.forbidden('This account has been deactivated. Please contact support.');
  }

  if (user.isTwoFactorEnabled) {
    if (!input.twoFactorCode) {
      // Signal to the client that a second factor is required, without
      // issuing tokens yet.
      throw new AppError('Two-factor authentication code required', 428, 'TWO_FACTOR_REQUIRED');
    }
    const valid = authenticator.verify({ token: input.twoFactorCode, secret: user.twoFactorSecret ?? '' });
    if (!valid) {
      throw AppError.unauthorized('Invalid two-factor authentication code');
    }
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const session = await buildSession(user.id, user.role, user.email, meta);

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'LOGIN', entity: 'User', entityId: user.id, ipAddress: meta.ipAddress },
  });

  return { user: publicUser(user), ...session };
};

export const loginWithGoogle = async (idToken: string, meta: SessionMeta) => {
  if (!env.GOOGLE_CLIENT_ID) {
    throw AppError.badRequest('Google login is not configured on this server');
  }

  const ticket = await googleClient.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID }).catch(() => {
    throw AppError.unauthorized('Invalid Google token');
  });

  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw AppError.unauthorized('Google account has no verified email');
  }

  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId: payload.sub }, { email: payload.email }] },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: payload.email,
        firstName: payload.given_name ?? 'Student',
        lastName: payload.family_name ?? '',
        googleId: payload.sub,
        authProvider: 'GOOGLE',
        isEmailVerified: true,
        profilePictureUrl: payload.picture,
      },
    });
  } else if (!user.googleId) {
    // Link Google to an existing email/password account
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId: payload.sub, isEmailVerified: true },
    });
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const session = await buildSession(user.id, user.role, user.email, meta);

  return { user: publicUser(user), ...session };
};

export const verifyEmail = async (token: string) => {
  const record = await prisma.emailVerificationToken.findUnique({ where: { token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw AppError.badRequest('This verification link is invalid or has expired');
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { isEmailVerified: true } }),
    prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
};

export const resendVerificationEmail = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound('User not found');
  if (user.isEmailVerified) throw AppError.badRequest('Email is already verified');

  const token = randomBytes(32).toString('hex');
  await prisma.emailVerificationToken.create({
    data: { token, userId: user.id, expiresAt: new Date(Date.now() + DAY_MS) },
  });
  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;
  await sendVerificationEmail(user.email, user.firstName, verifyUrl);
};

export const requestPasswordReset = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always respond success to the caller even if the user doesn't exist,
  // to avoid leaking which emails are registered.
  if (!user) return;

  const token = randomBytes(32).toString('hex');
  await prisma.passwordResetToken.create({
    data: { token, userId: user.id, expiresAt: new Date(Date.now() + HOUR_MS) },
  });

  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;
  await sendPasswordResetEmail(user.email, user.firstName, resetUrl);
};

export const resetPassword = async (token: string, newPassword: string) => {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw AppError.badRequest('This password reset link is invalid or has expired');
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.refreshToken.updateMany({ where: { userId: record.userId, revoked: false }, data: { revoked: true } }),
  ]);
};

export const generateTwoFactorSecret = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound('User not found');

  const secret = authenticator.generateSecret();
  await prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret } });

  const otpAuthUrl = authenticator.keyuri(user.email, 'Tricky Solver Academy', secret);
  return { secret, otpAuthUrl };
};

export const enableTwoFactor = async (userId: string, code: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.twoFactorSecret) {
    throw AppError.badRequest('Generate a 2FA secret before enabling two-factor authentication');
  }

  const valid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
  if (!valid) {
    throw AppError.badRequest('Invalid verification code');
  }

  await prisma.user.update({ where: { id: userId }, data: { isTwoFactorEnabled: true } });
};

export const disableTwoFactor = async (userId: string) => {
  await prisma.user.update({
    where: { id: userId },
    data: { isTwoFactorEnabled: false, twoFactorSecret: null },
  });
};

export { publicUser };
