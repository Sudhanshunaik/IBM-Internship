'use strict';

const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const config = require('../config');
const { HttpError } = require('./error');

function signToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(StatusCodes.UNAUTHORIZED, 'missing or malformed bearer token'));
  }
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = { id: decoded.sub, email: decoded.email, role: decoded.role };
    return next();
  } catch (err) {
    return next(new HttpError(StatusCodes.UNAUTHORIZED, 'invalid or expired token'));
  }
}

function requireRole(role) {
  return (req, _res, next) => {
    if (!req.user || req.user.role !== role) {
      return next(new HttpError(StatusCodes.FORBIDDEN, `requires role: ${role}`));
    }
    return next();
  };
}

module.exports = { signToken, requireAuth, requireRole };
