'use strict';

const { StatusCodes } = require('http-status-codes');

class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function notFound(req, res, next) {
  next(new HttpError(StatusCodes.NOT_FOUND, `route not found: ${req.method} ${req.originalUrl}`));
}

// Centralized error handler — last middleware in the chain.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const payload = {
    error: {
      message: err.message || 'internal server error',
    },
  };
  if (err.details) payload.error.details = err.details;

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
  }

  res.status(status).json(payload);
}

module.exports = { HttpError, notFound, errorHandler };
