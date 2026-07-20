'use strict';

const Joi = require('joi');
const { StatusCodes } = require('http-status-codes');
const User = require('../models/User');
const { signToken } = require('../middleware/auth');
const { HttpError } = require('../middleware/error');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  name: Joi.string().max(80).allow(''),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
});

async function register(input) {
  const { email, password, name } = input;
  const existing = await User.findOne({ email });
  if (existing) {
    throw new HttpError(StatusCodes.CONFLICT, 'email already registered');
  }
  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ email, passwordHash, name });
  const token = signToken({ sub: user._id.toString(), email: user.email, role: user.role });
  return { user: user.toSafeJSON(), token };
}

async function login(input) {
  const { email, password } = input;
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'invalid credentials');
  }
  const ok = await user.verifyPassword(password);
  if (!ok) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'invalid credentials');
  }
  const token = signToken({ sub: user._id.toString(), email: user.email, role: user.role });
  return { user: user.toSafeJSON(), token };
}

module.exports = { register, login, registerSchema, loginSchema };
