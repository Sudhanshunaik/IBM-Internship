import { Router } from 'express';
import * as auth from '../controllers/auth.controller';
import { validateBody, asyncHandler } from '../middleware/errors';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * Auth endpoints.
 *
 * POST   /api/auth/register   — create account
 * POST   /api/auth/login      — exchange creds for tokens
 * POST   /api/auth/refresh    — exchange refresh token for new access
 * POST   /api/auth/logout     — invalidate refresh
 * GET    /api/auth/me         — current user
 */
router.post('/register', validateBody('RegisterRequest'), asyncHandler(auth.register));
router.post('/login',    validateBody('LoginRequest'),    asyncHandler(auth.login));
router.post('/refresh',  validateBody('RefreshRequest'),  asyncHandler(auth.refresh));
router.post('/logout',   requireAuth,                    asyncHandler(auth.logout));
router.get('/me',        requireAuth,                    asyncHandler(auth.me));

export default router;