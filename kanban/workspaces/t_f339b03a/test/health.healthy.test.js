'use strict';

// Demonstrates /health returning 200 when mongoose is "connected" —
// patches Module._load so the patched db module's dbStatus() reports 1.

const fs = require('fs');
const path = require('path');
const LOG = path.join(__dirname, '..', '.health-healthy.log');
const lines = [];
function log(msg) {
  lines.push('[health-healthy] ' + msg);
}

const Module = require('module');
const realLoad = Module._load;
Module._load = function patched(request, parent, ...rest) {
  const exported = realLoad.call(this, request, parent, ...rest);
  if (typeof request === 'string' && request.endsWith('config/db')) {
    return { ...exported, dbStatus: () => 1 };
  }
  return exported;
};

delete require.cache[require.resolve('../src/config/db')];
const { buildApp } = require('../src/app');
const { request } = require('undici');
const { mongoose } = require('../src/config/db');
const { shutdown } = require('../scripts/shutdown');

async function main() {
  log('start');
  const built = buildApp();
  const { httpServer, io } = built;
  await new Promise((r) => httpServer.listen(0, '127.0.0.1', r));
  const port = httpServer.address().port;
  log('listening on ' + port);

  const res = await request('http://127.0.0.1:' + port + '/health');
  const body = await res.body.json();
  log('status=' + res.statusCode + ' body=' + JSON.stringify(body));

  await shutdown({ httpServer, io, mongoose });
  Module._load = realLoad;

  const passed = res.statusCode === 200 && body.status === 'ok';
  log(passed ? 'OK' : 'FAIL');
  fs.writeFileSync(LOG, lines.join('\n') + '\n');
  process.exit(passed ? 0 : 1);
}

main().catch((err) => {
  log('FAIL: ' + err.message);
  Module._load = realLoad;
  fs.writeFileSync(LOG, lines.join('\n') + '\n');
  process.exit(1);
});
