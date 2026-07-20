'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server: IOServer } = require('socket.io');

const config = require('./config');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');
const { startExternalStream } = require('./services/stream.service');

function buildApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '100kb' }));
  app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true); // allow same-origin / curl
        if (config.cors.origins.includes('*') || config.cors.origins.includes(origin)) {
          return cb(null, true);
        }
        return cb(new Error(`origin not allowed: ${origin}`));
      },
      credentials: true,
    })
  );

  app.use(
    rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.use(routes);

  app.use(notFound);
  app.use(errorHandler);

  const httpServer = createServer(app);
  const io = new IOServer(httpServer, {
    cors: {
      origin: config.cors.origins.includes('*') ? '*' : config.cors.origins,
      credentials: true,
    },
    // Restrict to websocket transport: avoids engine.io spawning HTTP long-
    // poll handlers on the same http.Server, which on Windows trip a libuv
    // "UV_HANDLE_CLOSING" assertion during shutdown.
    transports: ['websocket'],
    serveClient: false,
  });

  const stopStream = startExternalStream(io, config.externalApi);

  // Expose io on the app so handlers / tests can reach it without a global.
  app.set('io', io);

  const shutdown = () =>
    Promise.resolve()
      .then(async () => {
        stopStream();
        if (io && typeof io.close === 'function') {
          await new Promise((resolve) => io.close(() => resolve()));
        }
        if (httpServer && httpServer.listening) {
          await new Promise((resolve) => {
            try {
              httpServer.close(() => resolve());
            } catch (_) {
              resolve();
            }
            if (typeof httpServer.closeAllConnections === 'function') {
              try { httpServer.closeAllConnections(); } catch (_) {}
            }
          });
        }
      });

  return { app, httpServer, io, shutdown };
}

module.exports = { buildApp };
