'use strict';

// Socket.IO end-to-end smoke: boot the app on an ephemeral port, open a
// client, assert we receive `stream:hello` on connect. Doesn't wait for a
// tick (those depend on the external API being reachable).

const fs = require('fs');
const path = require('path');
const LOG = path.join(__dirname, '..', '.socket-hello.log');
const lines = [];
function log(msg) {
  lines.push('[socket-hello] ' + msg);
}

const { io: ioClient } = require('socket.io-client');
const { buildApp } = require('../src/app');
const { connectDb, mongoose } = require('../src/config/db');
const { shutdown } = require('../scripts/shutdown');

async function main() {
  process.env.EXTERNAL_API_POLL_MS = '60000';
  log('start');
  await connectDb();
  const built = buildApp();
  const { httpServer, io } = built;
  await new Promise((r) => httpServer.listen(0, '127.0.0.1', r));
  const port = httpServer.address().port;
  log('listening on ' + port);

  const client = ioClient('http://127.0.0.1:' + port, {
    transports: ['websocket'],
    reconnection: false,
    timeout: 3000,
  });

  const hello = await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('hello timeout')), 4000);
    client.on('connect', () => log('client connected'));
    client.on('stream:hello', (p) => {
      clearTimeout(t);
      resolve(p);
    });
    client.on('connect_error', (e) => {
      clearTimeout(t);
      reject(e);
    });
  });

  log('hello payload: ' + JSON.stringify(hello));
  const passed = hello && hello.event === 'stream:tick' && typeof hello.intervalMs === 'number';

  client.close();
  await shutdown({ httpServer, io, mongoose });
  log(passed ? 'OK' : 'FAIL: hello payload shape unexpected');
  fs.writeFileSync(LOG, lines.join('\n') + '\n');
  process.exit(passed ? 0 : 1);
}

main().catch((err) => {
  log('FAIL: ' + err.message);
  try { fs.writeFileSync(LOG, lines.join('\n') + '\n'); } catch (_) {}
  process.exit(1);
});
