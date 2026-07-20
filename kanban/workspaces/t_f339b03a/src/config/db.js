'use strict';

const mongoose = require('mongoose');
const config = require('./index');

mongoose.set('strictQuery', true);

async function connectDb() {
  try {
    await mongoose.connect(config.mongo.uri, {
      serverSelectionTimeoutMS: 5000,
    });
    // eslint-disable-next-line no-console
    console.log(`[db] connected: ${config.mongo.uri}`);
  } catch (err) {
    // Don't crash the whole server on startup if Mongo isn't reachable —
    // the health route will surface it. The app should still boot so dev
    // can run /health and see the failure.
    // eslint-disable-next-line no-console
    console.error(`[db] connection failed: ${err.message}`);
  }

  mongoose.connection.on('disconnected', () => {
    // eslint-disable-next-line no-console
    console.warn('[db] disconnected');
  });
  mongoose.connection.on('reconnected', () => {
    // eslint-disable-next-line no-console
    console.log('[db] reconnected');
  });
}

function dbStatus() {
  // 0 disconnected, 1 connected, 2 connecting, 3 disconnecting
  return mongoose.connection.readyState;
}

module.exports = { connectDb, dbStatus, mongoose };
