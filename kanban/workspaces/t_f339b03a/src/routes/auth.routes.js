'use strict';

const { Router } = require('express');
const { validateBody } = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../services/auth.service');
const { postRegister, postLogin } = require('../controllers/auth.controller');

const router = Router();
router.post('/auth/register', validateBody(registerSchema), postRegister);
router.post('/auth/login', validateBody(loginSchema), postLogin);

module.exports = router;
