import { Router } from 'express';
import * as dss from '../controllers/datasources.controller';
import { validateBody, asyncHandler } from '../middleware/errors';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * Data source CRUD (all auth-required).
 *
 * GET    /api/datasources       — list own
 * POST   /api/datasources       — create
 * DELETE /api/datasources/:id   — delete (owner/admin)
 */
router.get('/',        requireAuth,  validateBody('CreateDataSourceRequest'), asyncHandler(dss.listDataSources));
router.post('/',       requireAuth,  validateBody('CreateDataSourceRequest'), asyncHandler(dss.createDataSource));
router.delete('/:id',  requireAuth,                                 asyncHandler(dss.deleteDataSource));

export default router;