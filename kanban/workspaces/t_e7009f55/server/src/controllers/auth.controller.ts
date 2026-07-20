import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import type {
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  RefreshRequest,
  PublicUser,
} from '@mern-3dviz/shared';
import { UserModel } from '../models/User';
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  accessTokenTtlSeconds,
} from '../auth/tokens';
import { env } from '../config/env';
import { HttpError } from '../middleware/errors';

function toPublicUser(u: { _id: Types.ObjectId; email: string; username: string; role: 'user' | 'admin'; createdAt: Date; updatedAt: Date }): PublicUser {
  return {
    _id: u._id.toString(),
    email: u.email,
    username: u.username,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    domain: env.COOKIE_DOMAIN,
    path: '/api/auth',
    maxAge: env.JWT_REFRESH_TTL_SEC * 1000,
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  const body = req.body as RegisterRequest;
  const existing = await UserModel.findOne({ email: body.email.toLowerCase() }).lean();
  if (existing) throw new HttpError(409, 'auth/email-taken', 'Email already registered');

  const passwordHash = await hashPassword(body.password);
  const user = await UserModel.create({
    email: body.email.toLowerCase(),
    username: body.username,
    passwordHash,
    role: 'user',
  });

  const accessToken = signAccessToken({ userId: user._id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ userId: user._id, tokenVersion: user.tokenVersion ?? 0 });
  setRefreshCookie(res, refreshToken);

  const payload: AuthResponse = {
    user: toPublicUser(user),
    tokens: { accessToken, refreshToken, expiresIn: accessTokenTtlSeconds() },
  };
  res.status(201).json(payload);
}

export async function login(req: Request, res: Response): Promise<void> {
  const body = req.body as LoginRequest;
  const user = await UserModel.findOne({ email: body.email.toLowerCase() }).select('+passwordHash').select('+tokenVersion');
  if (!user) throw new HttpError(401, 'auth/bad-credentials', 'Invalid email or password');
  const ok = await verifyPassword(body.password, user.passwordHash);
  if (!ok) throw new HttpError(401, 'auth/bad-credentials', 'Invalid email or password');

  const accessToken = signAccessToken({ userId: user._id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ userId: user._id, tokenVersion: user.tokenVersion ?? 0 });
  setRefreshCookie(res, refreshToken);

  const payload: AuthResponse = {
    user: toPublicUser(user),
    tokens: { accessToken, refreshToken, expiresIn: accessTokenTtlSeconds() },
  };
  res.json(payload);
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const cookieToken = (req as Request & { cookies?: Record<string, string> }).cookies?.refresh_token;
  const body = req.body as Partial<RefreshRequest>;
  const token = cookieToken ?? body.refreshToken;
  if (!token) throw new HttpError(400, 'auth/no-refresh-token', 'refreshToken required');

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new HttpError(401, 'auth/invalid-refresh-token', 'Invalid or expired refresh token');
  }
  const user = await UserModel.findById(decoded.sub).select('+tokenVersion');
  if (!user) throw new HttpError(401, 'auth/unknown-user', 'User no longer exists');
  if ((user.tokenVersion ?? 0) !== decoded.tokenVersion) {
    throw new HttpError(401, 'auth/refresh-revoked', 'Refresh token revoked');
  }

  const accessToken = signAccessToken({ userId: user._id, email: user.email, role: user.role });
  const newRefresh = signRefreshToken({ userId: user._id, tokenVersion: user.tokenVersion ?? 0 });
  setRefreshCookie(res, newRefresh);

  res.json({
    tokens: { accessToken, refreshToken: newRefresh, expiresIn: accessTokenTtlSeconds() },
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  // Invalidate the refresh by bumping tokenVersion.
  if (req.auth?.sub) {
    await UserModel.updateOne({ _id: req.auth.sub }, { $inc: { tokenVersion: 1 } });
  }
  res.clearCookie('refresh_token', { path: '/api/auth' });
  res.status(204).end();
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.auth) throw new HttpError(401, 'auth/missing-token', 'Authentication required');
  const user = await UserModel.findById(req.auth.sub);
  if (!user) throw new HttpError(404, 'auth/user-not-found', 'User not found');
  res.json({ user: toPublicUser(user) });
}