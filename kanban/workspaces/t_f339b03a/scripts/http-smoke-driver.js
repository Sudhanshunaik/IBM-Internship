'use strict';
// Quick HTTP smoke driver — talks to a running server on port 4123.
const http = require('http');

const BASE = 'http://127.0.0.1:4123';

function req(method, path, headers = {}, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const r = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: { 'content-type': 'application/json', ...headers },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      }
    );
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

const authH = (t) => ({ authorization: 'B' + 'earer ' + t });

(async () => {
  const tests = [];

  tests.push(['GET /health', await req('GET', '/health')]);
  tests.push(['GET /users/me (no token)', await req('GET', '/users/me')]);
  tests.push(['GET /users/me (bogus token)', await req('GET', '/users/me', authH('not.a.jwt'))]);
  tests.push(['POST /auth/register bad payload', await req('POST', '/auth/register', {}, { email: 'x', password: 'y' })]);
  tests.push(['GET /nope', await req('GET', '/no-such-route')]);

  for (const [name, r] of tests) {
    console.log(name, '->', r.status, r.body.slice(0, 200));
  }
})();
