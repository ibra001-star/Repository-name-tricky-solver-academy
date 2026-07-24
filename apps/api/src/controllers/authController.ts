import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { env, isProduction } from '../config/env';
import * as authService from '../services/authService';
import * as tokenService from '../services/tokenService';
import { prisma } from '../config/prisma';
import { signAccessToken } from '../utils/jwt';

// Refresh tokens are stored as httpOnly cookies so they're inaccessible to
// JavaScript (mitigating XSS token theft), while access tokens are returned
// in the JSON body for the client to hold in memory and attach as a Bearer header.
const REFRESH_COOKIE = 'tsa_refresh_token';

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
  maxAge: env.JWT_REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
};

const sessionMeta = (req: Request) => ({
  userAgent: req.headers['user-agent'],
  ipAddress: req.ip,
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { accessToken, refreshToken, user } = await authService.registerUser(req.body, sessionMeta(req));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  res.status(201).json({ success: true, data: { user, accessToken } });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { accessToken, refreshToken, user } = await authService.loginUser(req.body, sessionMeta(req));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  res.status(200).json({ success: true, data: { user, accessToken } });
});

export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const { accessToken, refreshToken, user } = await authService.loginWithGoogle(req.body.idToken, sessionMeta(req));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  res.status(200).json({ success: true, data: { user, accessToken } });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const oldToken = req.cookies?.[REFRESH_COOKIE];
  if (!oldToken) throw AppError.unauthorized('No refresh token provided');

  const { userId, newToken } = await tokenService.rotateRefreshToken(oldToken, sessionMeta(req));

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.unauthorized('User no longer exists');

  const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
  res.cookie(REFRESH_COOKIE, newToken, cookieOptions);
  res.status(200).json({ success: true, data: { accessToken, user: authService.publicUser(user) } });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) await tokenService.revokeRefreshToken(token);
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export const logoutAllDevices = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  await tokenService.revokeAllUserTokens(req.user.id);
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
  res.status(200).json({ success: true, message: 'Logged out of all devices' });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  await authService.verifyEmail(req.body.token);
  res.status(200).json({ success: true, message: 'Email verified successfully' });
});

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  await authService.resendVerificationEmail(req.user.id);
  res.status(200).json({ success: true, message: 'Verification email sent' });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.requestPasswordReset(req.body.email);
  res.status(200).json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.',
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.newPassword);
  res.status(200).json({ success: true, message: 'Password reset successfully. Please log in.' });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw AppError.notFound('User not found');
  res.status(200).json({ success: true, data: { user: authService.publicUser(user) } });
});

export const setup2fa = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const result = await authService.generateTwoFactorSecret(req.user.id);
  res.status(200).json({ success: true, data: result });
});

export const enable2fa = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  await authService.enableTwoFactor(req.user.id, req.body.code);
  res.status(200).json({ success: true, message: 'Two-factor authentication enabled' });
});

export const disable2fa = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  await authService.disableTwoFactor(req.user.id);
  res.status(200).json({ success: true, message: 'Two-factor authentication disabled' });
});
