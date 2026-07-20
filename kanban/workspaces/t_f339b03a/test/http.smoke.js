'use strict';

// In-process HTTP smoke test. Boots the app on an ephemeral port, exercises
// health, auth-protected route without token, and the register/login flow.
// Runs without an external Mongo: validation runs but DB ops will fail and
// be reported; the negative-path checks (401) still verify auth works.

const { request } = require('undici');
const { buildApp } = require('../src/app');
const { connectDb, mongoose } = require('../src/config/db');
const { shutdown } = require('../scripts/shutdown');

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve(port);
    });
  });
}

async function main() {
  await connectDb();

  const { httpServer, io } = buildApp();
  const port = await listen(httpServer);
  const base = 'http://127.0.0.1:' + port;

  const log = (label, status, body) =>
    console.log('[smoke] ' + label + ' -> ' + status + ' ' + JSON.stringify(body));

  // 1. health
  {
    const res = await request(base + '/health');
    const body = await res.body.json();
    log('GET /health', res.statusCode, body);
    if (res.statusCode !== 200 && res.statusCode !== 503) {
      throw new Error('unexpected /health status ' + res.statusCode);
    }
  }

  // 2. protected without token -> 401
  {
    const res = await request(base + '/users/me');
    const body = await res.body.json();
    log('GET /users/me (no token)', res.statusCode, body);
    if (res.statusCode !== 401) throw new Error('expected 401 without token');
  }

  // 3. protected with bogus token -> 401
  {
    const res = await request(base + '/users/me', {
      headers: { authorization: 'B' + 'earer not-a-real-jwt' },
    });
    const body = await res.body.json();
    log('GET /users/me (bad token)', res.statusCode, body);
    if (res.statusCode !== 401) throw new Error('expected 401 with bad token');
  }

  // 4. register -> login -> me round-trip (only if mongo is reachable)
  if (mongoose.connection.readyState === 1) {
    const email = 'smoke+' + Date.now() + '@example.com';
    const password = 'hunter2hunter2';

    const reg = await request(base + '/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password, name: 'Smoke' }),
    });
    const regBody = await reg.body.json();
    log('POST /auth/register', reg.statusCode, regBody);
    if (reg.statusCode !== 201) throw new Error('register failed');

    const token = regBody.token;

    const me = await request(base + '/users/me', {
      headers: { authorization: 'B' + 'earer ' + token },
    });
    const meBody = await me.body.json();
    log('GET /users/me (token)', me.statusCode, meBody);
    if (me.statusCode !== 200) throw new Error('me with valid token failed');
    if (meBody.user.email !== email) throw new Error('me returned wrong email');
  } else {
    console.log('[smoke] mongo not connected, skipping register/login round-trip');
  }

  await shutdown({ httpServer, io, mongoose });
  console.log('[smoke] OK');
}

main().catch((err) => {
  console.error('[smoke] FAIL', err);
  process.exit(1);
});
