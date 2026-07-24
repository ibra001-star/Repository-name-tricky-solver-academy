import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { Role } from '@prisma/client';

export interface AccessTokenPayload extends JwtPayload {
  sub: string; // user id
  role: Role;
  email: string;
}

// Access tokens are short-lived (15m default) and used to authorize API
// requests. Refresh tokens are long-lived, stored hashed-free in DB (as
// opaque random strings, not JWTs) so they can be revoked individually —
// see tokenService for issuance/rotation.
export const signAccessToken = (payload: { sub: string; role: Role; email: string }): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRY as SignOptions['expiresIn'],
    issuer: 'tricky-solver-academy',
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: 'tricky-solver-academy',
  }) as AccessTokenPayload;
};
