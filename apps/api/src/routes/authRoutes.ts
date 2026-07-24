import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  enable2faSchema,
} from '../utils/validators/authValidators';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new student or teacher account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password]
 *             properties:
 *               firstName: { type: string, example: Amina }
 *               lastName: { type: string, example: Hassan }
 *               email: { type: string, example: amina@example.com }
 *               password: { type: string, example: StrongPass123 }
 *               phone: { type: string, example: "+254712345678" }
 *               role: { type: string, enum: [STUDENT, TEACHER], example: STUDENT }
 *     responses:
 *       201: { description: Account created successfully }
 *       409: { description: Email already registered }
 */
router.post('/register', authLimiter, validate(registerSchema), authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               twoFactorCode: { type: string, example: "123456" }
 *     responses:
 *       200: { description: Logged in successfully }
 *       401: { description: Invalid credentials }
 *       428: { description: Two-factor authentication code required }
 */
router.post('/login', authLimiter, validate(loginSchema), authController.login);

/**
 * @openapi
 * /auth/google:
 *   post:
 *     tags: [Auth]
 *     summary: Log in or register using a Google ID token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken: { type: string }
 *     responses:
 *       200: { description: Logged in successfully via Google }
 */
router.post('/google', authLimiter, validate(googleAuthSchema), authController.googleLogin);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange a refresh token cookie for a new access token
 *     responses:
 *       200: { description: New access token issued }
 *       401: { description: Invalid or expired refresh token }
 */
router.post('/refresh', authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out the current session
 *     responses:
 *       200: { description: Logged out successfully }
 */
router.post('/logout', authController.logout);

/**
 * @openapi
 * /auth/logout-all:
 *   post:
 *     tags: [Auth]
 *     summary: Log out of all devices (revokes all refresh tokens)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: All sessions revoked }
 */
router.post('/logout-all', authenticate, authController.logoutAllDevices);

/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email address using a token sent by email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string }
 *     responses:
 *       200: { description: Email verified }
 *       400: { description: Invalid or expired token }
 */
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);

/**
 * @openapi
 * /auth/resend-verification:
 *   post:
 *     tags: [Auth]
 *     summary: Resend the email verification link
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Verification email sent }
 */
router.post('/resend-verification', authenticate, authController.resendVerification);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset link
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200: { description: Reset link sent if account exists }
 */
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using a token from the reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200: { description: Password reset successfully }
 *       400: { description: Invalid or expired token }
 */
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), authController.resetPassword);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user's profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Current user returned }
 *       401: { description: Not authenticated }
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @openapi
 * /auth/2fa/setup:
 *   post:
 *     tags: [Auth]
 *     summary: Generate a new 2FA secret and QR provisioning URL
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: 2FA secret generated }
 */
router.post('/2fa/setup', authenticate, authController.setup2fa);

/**
 * @openapi
 * /auth/2fa/enable:
 *   post:
 *     tags: [Auth]
 *     summary: Confirm and enable 2FA using a 6-digit code
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string, example: "123456" }
 *     responses:
 *       200: { description: 2FA enabled }
 */
router.post('/2fa/enable', authenticate, validate(enable2faSchema), authController.enable2fa);

/**
 * @openapi
 * /auth/2fa/disable:
 *   post:
 *     tags: [Auth]
 *     summary: Disable 2FA for the current account
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: 2FA disabled }
 */
router.post('/2fa/disable', authenticate, authController.disable2fa);

export default router;
