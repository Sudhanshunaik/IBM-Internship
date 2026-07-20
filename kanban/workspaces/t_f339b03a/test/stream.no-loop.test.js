'use strict';

// Boots the app, captures stream-service log lines, and asserts the stream
// is NOT in a tight retry loop. Uses EXTERNAL_API_POLL_MS=30000 via env so
// the test only needs ~3 seconds to observe one scheduled tick at most.

const fs = require('fs');
const path = require('path');
const LOG = path.join(__dirname, '..', '.stream-no-loop.log');
const lines = [];
function log(msg) {
  lines.push('[stream-no-loop] ' + msg);
}

const { buildApp } = require('../src/app');
const { connectDb, mongoose } = require('../src/config/db');
const { shutdown } = require('../scripts/shutdown');

async function main() {
  log('main entered');
  process.env.EXTERNAL_API_POLL_MS = '30000';
  log('env set');

  const originalWarn = console.warn;
  let fetchFails = 0;
  console.warn = (...args) => {
    const msg = args.join(' ');
    if (msg.includes('[stream] fetch failed')) fetchFails += 1;
    originalWarn.apply(console, args);
  };

  log('connecting db');
  await connectDb();
  log('db attempted');

  log('building app');
  const built = buildApp();
  log('buildApp returned');
  const { httpServer } = built;
  log('destructured');
  await new Promise((r) => httpServer.listen(0, '127.0.0.1', r));
  log('listening on ' + httpServer.address().port);

  // Wait 3 seconds — no scheduled tick should fire within this window.
  await new Promise((r) => setTimeout(r, 3000));

  console.warn = originalWarn;
  await shutdown({ httpServer, io: built.io, mongoose });
  log('fetch failures in 3s window = ' + fetchFails);
  const passed = fetchFails <= 1;
  log(passed ? 'OK' : 'FAIL: stream is retrying too fast');
  // Synchronous write so we don't depend on async flush for the result.
  fs.writeFileSync(LOG, lines.join('\n') + '\n');
  process.exit(passed ? 0 : 1);
}

main().catch((err) => {
  log('FAIL: ' + err.message);
  fs.writeFileSync(LOG, lines.join('\n') + '\n');
  process.exit(1);
});
