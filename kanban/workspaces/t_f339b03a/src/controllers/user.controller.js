'use strict';

const { StatusCodes } = require('http-status-codes');

async function getMe(req, res) {
  // requireAuth populates req.user from the JWT payload.
  res.status(StatusCodes.OK).json({ user: req.user });
}

module.exports = { getMe };
