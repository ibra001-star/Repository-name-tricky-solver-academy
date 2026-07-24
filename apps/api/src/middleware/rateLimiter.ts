import rateLimit from 'express-rate-limit';

// General API rate limit — generous enough for normal browsing/study sessions.
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' },
});

// Strict limiter for auth endpoints (login, register, password reset) to
// mitigate credential stuffing and brute-force attacks.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, code: 'TOO_MANY_REQUESTS', message: 'Too many attempts. Please try again in 15 minutes.' },
});

// Even stricter for password-reset requests specifically, since these can be
// abused to spam a victim's inbox.
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, code: 'TOO_MANY_REQUESTS', message: 'Too many password reset requests. Please try again later.' },
});
