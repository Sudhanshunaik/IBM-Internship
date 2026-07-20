'use strict';
const Module = require('module');
const realLoad = Module._load;
Module._load = function patched(request, parent, ...rest) {
  const exported = realLoad.call(this, request, parent, ...rest);
  if (typeof request === 'string' && request.endsWith('config/db')) {
    return { ...exported, dbStatus: () => 1 };
  }
  return exported;
};
delete require.cache[require.resolve('./src/config/db')];
const { buildApp } = require('./src/app');
const { request, Agent } = require('undici');
const { mongoose } = require('./src/config/db');

(async () => {
  const built = buildApp();
  const { httpServer, io } = built;
  await new Promise(r => httpServer.listen(0, '127.0.0.1', r));
  const port = httpServer.address().port;
  const agent = new Agent({ pipelining: 0 });
  const res = await request('http://127.0.0.1:' + port + '/health', { dispatcher: agent });
  await res.body.json();
  // Use unref + closeAllConnections + listen again on a closed port to ensure uv_close fires
  httpServer.unref();
  if (typeof httpServer.closeAllConnections === 'function') httpServer.closeAllConnections();
  // nuke the listening socket directly
  if (httpServer._handle && httpServer._handle.close) {
    try { httpServer._handle.close(() => {}); } catch (_) {}
  }
  // Also force the io's engine.io internal handle
  if (io && io.engine && io.engine.httpServer && io.engine.httpServer._handle) {
    try { io.engine.httpServer._handle.close(() => {}); } catch (_) {}
  }
  await agent.destroy();
  // Wait several ticks for libuv to actually drop the handle
  for (let i = 0; i < 5; i++) await new Promise(r => setImmediate(r));
  console.log('--- handles AFTER ---');
  for (const h of process._getActiveHandles()) console.log(h.constructor && h.constructor.name);
  Module._load = realLoad;
  process.exit(0);
})();
