import { randomBytes } from 'crypto';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

const REFRESH_TOKEN_BYTES = 64;

const daysFromNow = (days: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

// Refresh tokens are opaque random strings (not JWTs) stored in the DB.
// This lets us revoke individual sessions (e.g. "log out this device")
// without needing a token blacklist, and lets us detect reuse of a
// rotated-out token, which is a strong signal of token theft.
export const issueRefreshToken = async (
  userId: string,
  meta: { userAgent?: string; ipAddress?: string }
): Promise<string> => {
  const token = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt: daysFromNow(env.JWT_REFRESH_EXPIRY_DAYS),
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    },
  });
  return token;
};

export const rotateRefreshToken = async (
  oldToken: string,
  meta: { userAgent?: string; ipAddress?: string }
): Promise<{ userId: string; newToken: string }> => {
  const existing = await prisma.refreshToken.findUnique({ where: { token: oldToken } });

  if (!existing) {
    throw AppError.unauthorized('Invalid refresh token');
  }

  if (existing.revoked) {
    // Reuse of a revoked token is a red flag: someone may have stolen an
    // old token. As a precaution, revoke all of this user's sessions.
    await prisma.refreshToken.updateMany({
      where: { userId: existing.userId, revoked: false },
      data: { revoked: true },
    });
    throw AppError.unauthorized('Refresh token reuse detected. All sessions revoked.');
  }

  if (existing.expiresAt < new Date()) {
    throw AppError.unauthorized('Refresh token expired');
  }

  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revoked: true },
  });

  const newToken = await issueRefreshToken(existing.userId, meta);
  return { userId: existing.userId, newToken };
};

export const revokeRefreshToken = async (token: string): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { token },
    data: { revoked: true },
  });
};

export const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });
};
