'use strict';

const { StatusCodes } = require('http-status-codes');
const { HttpError } = require('./error');

// Validates `req.body` against a Joi schema. Replaces req.body with the
// coerced/cleaned value so handlers never see raw user input.
function validateBody(schema) {
  return (req, _res, next) => {
    const { value, error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      return next(
        new HttpError(StatusCodes.BAD_REQUEST, 'validation failed', error.details.map((d) => d.message))
      );
    }
    req.body = value;
    return next();
  };
}

module.exports = { validateBody };
