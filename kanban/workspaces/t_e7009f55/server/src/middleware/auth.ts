import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../auth/tokens';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const headerToken = req.header('authorization')?.replace(/^Bearer\s+/i, '');
  const cookieToken = (req as Request & { cookies?: Record<string, string> }).cookies?.access_token;
  const token = headerToken ?? cookieToken;
  if (!token) {
    res.status(401).json({ error: { code: 'auth/missing-token', message: 'Authentication required' } });
    return;
  }
  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ error: { code: 'auth/invalid-token', message: 'Invalid or expired token' } });
  }
}

/** Optional variant: attaches req.auth if present, never rejects. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const headerToken = req.header('authorization')?.replace(/^Bearer\s+/i, '');
  const cookieToken = (req as Request & { cookies?: Record<string, string> }).cookies?.access_token;
  const token = headerToken ?? cookieToken;
  if (token) {
    try {
      req.auth = verifyAccessToken(token);
    } catch {
      // ignore — treat as anonymous
    }
  }
  next();
}

export function requireRole(role: 'admin') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.auth?.role !== role) {
      res.status(403).json({ error: { code: 'auth/forbidden', message: 'Insufficient role' } });
      return;
    }
    next();
  };
}