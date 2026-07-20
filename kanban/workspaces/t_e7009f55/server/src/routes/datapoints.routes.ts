import { Router } from 'express';
import * as dp from '../controllers/datapoints.controller';
import { asyncHandler } from '../middleware/errors';
import { optionalAuth, requireAuth } from '../middleware/auth';

const router = Router();

/**
 * Data point reads/writes.
 *
 * GET    /api/datapoints        — paginated, optionally filtered by dataSourceId
 * POST   /api/datapoints        — append one (auth required)
 */
router.get('/',   optionalAuth,                                       asyncHandler(dp.listDataPoints));
router.post('/',  requireAuth,                                        asyncHandler(dp.appendDataPoint));

export default router;