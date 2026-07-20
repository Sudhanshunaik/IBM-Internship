import jwt, { type SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { env } from '../config/env';
import type { JwtAccessPayload, JwtRefreshPayload } from '@mern-3dviz/shared';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const jwtLib: any = (jwt as any).default ?? jwt;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const bcryptLib: any = (bcrypt as any).default ?? bcrypt;

const BCRYPT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcryptLib.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcryptLib.compare(plain, hash);
}

export function signAccessToken(payload: { userId: Types.ObjectId | string; email: string; role: 'user' | 'admin' }): string {
  const opts: SignOptions = { expiresIn: env.JWT_ACCESS_TTL_SEC, algorithm: 'HS256' };
  return jwtLib.sign(
    { sub: payload.userId.toString(), email: payload.email, role: payload.role },
    env.JWT_ACCESS_SECRET,
    opts
  );
}

export function signRefreshToken(payload: { userId: Types.ObjectId | string; tokenVersion: number }): string {
  const opts: SignOptions = { expiresIn: env.JWT_REFRESH_TTL_SEC, algorithm: 'HS256' };
  return jwtLib.sign(
    { sub: payload.userId.toString(), tokenVersion: payload.tokenVersion },
    env.JWT_REFRESH_SECRET,
    opts
  );
}

export function verifyAccessToken(token: string): JwtAccessPayload {
  return jwtLib.verify(token, env.JWT_ACCESS_SECRET) as JwtAccessPayload;
}

export function verifyRefreshToken(token: string): JwtRefreshPayload {
  return jwtLib.verify(token, env.JWT_REFRESH_SECRET) as JwtRefreshPayload;
}

export function accessTokenTtlSeconds(): number {
  return env.JWT_ACCESS_TTL_SEC;
}