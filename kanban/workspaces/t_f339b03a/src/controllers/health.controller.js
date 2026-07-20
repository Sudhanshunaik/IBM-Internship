'use strict';

const { StatusCodes } = require('http-status-codes');
const { dbStatus } = require('../config/db');

const STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

async function getHealth(_req, res) {
  const db = dbStatus();
  const ok = db === 1;
  res.status(ok ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE).json({
    status: ok ? 'ok' : 'degraded',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    db: { state: STATES[db] ?? 'unknown', readyState: db },
  });
}

module.exports = { getHealth };
