'use strict';

const { Router } = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');

const router = Router();
router.use(healthRoutes);
router.use(authRoutes);
router.use(userRoutes);

module.exports = router;
