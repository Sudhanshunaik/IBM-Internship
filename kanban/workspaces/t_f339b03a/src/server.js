'use strict';

const config = require('./config');
const { connectDb } = require('./config/db');
const { buildApp } = require('./app');

async function main() {
  await connectDb();
  const { httpServer, shutdown } = buildApp();

  httpServer.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] listening on http://localhost:${config.port} (env=${config.env})`);
  });

  const close = async () => {
    // eslint-disable-next-line no-console
    console.log('[server] shutting down');
    await shutdown();
    process.exit(0);
  };
  process.on('SIGINT', close);
  process.on('SIGTERM', close);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[server] fatal startup error:', err);
  process.exit(1);
});
