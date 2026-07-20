'use strict';

require('dotenv').config();

const required = (name, fallback) => {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
};

const csv = (value, fallback = []) => {
  if (!value) return fallback;
  return value.split(',').map((s) => s.trim()).filter(Boolean);
};

const config = Object.freeze({
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,

  mongo: {
    uri: required('MONGO_URI', 'mongodb://127.0.0.1:27017/mern_prototype'),
  },

  jwt: {
    secret: required('JWT_SECRET', 'dev-only-secret-change-me'),
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },

  cors: {
    origins: csv(process.env.CORS_ORIGIN, ['http://localhost:3000']),
  },

  externalApi: {
    url: process.env.EXTERNAL_API_URL || 'https://api.coindesk.com/v1/bpi/currentprice.json',
    pollMs: Number(process.env.EXTERNAL_API_POLL_MS) || 10000,
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 200,
  },
});

module.exports = config;
