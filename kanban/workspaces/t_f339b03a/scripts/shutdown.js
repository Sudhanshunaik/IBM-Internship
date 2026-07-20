'use strict';

// Cross-platform shutdown helper for tests + production. socket.io attaches
// its own engine.io server to the underlying http.Server. On Windows,
// closing both via httpServer.close + io.close concurrently trips a libuv
// assertion (UV_HANDLE_CLOSING). Two mitigations:
//
//   1. Stop accepting new connections, then force-close any keep-alive
//      sockets so httpServer.close() actually resolves.
//   2. Skip io.close() in test mode (set `closeIo: false`). When the test
//      process exits, Node tears down every handle and the assertion can't
//      fire because no code is racing libuv. This is safe for short-lived
//      test scripts — production callers pass `closeIo: true`.

async function shutdown({
  httpServer,
  io,
  mongoose,
  mongooseDisconnect = true,
  closeIo = false,
  logger = console,
}) {
  // 1. Stop accepting new connections.
  if (httpServer && httpServer.listening) {
    await new Promise((resolve) => {
      try {
        httpServer.close(() => resolve());
      } catch (err) {
        logger.warn?.('[shutdown] httpServer.close threw:', err.message);
        resolve();
      }
    });
  }

  // 2. Force-close any keep-alive sockets so the close() callback fires.
  if (httpServer && typeof httpServer.closeAllConnections === 'function') {
    try {
      httpServer.closeAllConnections();
    } catch (_) {
      /* ignore */
    }
  }

  // 3. Disconnect socket.io unless caller opted out.
  if (closeIo && io && typeof io.close === 'function') {
    try {
      await new Promise((resolve, reject) => {
        io.close((err) => (err ? reject(err) : resolve()));
      });
    } catch (err) {
      logger.warn?.('[shutdown] io.close threw:', err.message);
    }
  }

  // 4. Let libuv drain any pending operations before mongoose disconnect.
  if (closeIo) {
    await new Promise((r) => setImmediate(r));
  }

  // 5. Disconnect mongoose.
  if (
    mongooseDisconnect &&
    mongoose &&
    mongoose.connection &&
    mongoose.connection.readyState !== 0
  ) {
    try {
      await mongoose.disconnect();
    } catch (_) {
      /* ignore */
    }
  }
}

module.exports = { shutdown };