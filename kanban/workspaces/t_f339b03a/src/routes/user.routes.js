'use strict';

const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { getMe } = require('../controllers/user.controller');

const router = Router();
router.get('/users/me', requireAuth, getMe);

module.exports = router;
