import { Router } from 'express';
import * as scenes from '../controllers/scenes.controller';
import { validateBody, asyncHandler } from '../middleware/errors';
import { requireAuth, optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * Scene CRUD.
 *
 * GET    /api/scenes       — list (public + own; auth optional)
 * POST   /api/scenes       — create (auth required)
 * GET    /api/scenes/:id   — get one
 * PUT    /api/scenes/:id   — update (owner/admin)
 * DELETE /api/scenes/:id   — delete (owner/admin)
 */
router.get('/',         optionalAuth,                              asyncHandler(scenes.listScenes));
router.post('/',        requireAuth,  validateBody('CreateSceneRequest'), asyncHandler(scenes.createScene));
router.get('/:id',      optionalAuth,                              asyncHandler(scenes.getScene));
router.put('/:id',      requireAuth,  validateBody('UpdateSceneRequest'), asyncHandler(scenes.updateScene));
router.delete('/:id',   requireAuth,                              asyncHandler(scenes.deleteScene));

export default router;