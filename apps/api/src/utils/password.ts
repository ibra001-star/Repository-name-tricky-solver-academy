import argon2 from 'argon2';

// argon2id is the current OWASP-recommended password hashing algorithm —
// memory-hard, resistant to GPU/ASIC cracking, and the winner of the
// Password Hashing Competition. Preferred over bcrypt for new systems.
export const hashPassword = async (plain: string): Promise<string> => {
  return argon2.hash(plain, {
    type: argon2.argon2id,
    memoryCost: 19456, // ~19 MB, OWASP minimum recommendation
    timeCost: 2,
    parallelism: 1,
  });
};

export const verifyPassword = async (hash: string, plain: string): Promise<boolean> => {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
};

// Basic password strength check enforced at registration/reset time.
export const isPasswordStrong = (password: string): boolean => {
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasMinLength && hasUpper && hasLower && hasNumber;
};
