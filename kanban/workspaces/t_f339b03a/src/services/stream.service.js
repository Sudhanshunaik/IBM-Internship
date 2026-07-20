'use strict';

const config = require('../config');

// Polls an external JSON endpoint on an interval and broadcasts a normalized
// payload to every connected socket on the given event channel. The service
// keeps running for the lifetime of the process; failure to fetch is logged
// and the next tick will retry.
function startExternalStream(io, { url, pollMs, event = 'stream:tick', logger = console } = config.externalApi) {
  const intervalMs = Number.isFinite(pollMs) && pollMs > 0 ? pollMs : 10000;
  let timer = null;
  let stopped = false;

  async function tick() {
    if (stopped) return;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`upstream ${res.status}`);
      const data = await res.json();
      const payload = {
        source: url,
        receivedAt: new Date().toISOString(),
        data,
      };
      io.emit(event, payload);
      logger.log?.(`[stream] emitted ${event} to ${io.sockets.sockets.size} client(s)`);
    } catch (err) {
      logger.warn?.(`[stream] fetch failed: ${err.message}`);
    } finally {
      if (!stopped) timer = setTimeout(tick, intervalMs);
    }
  }

  // First tick fires after one interval; clients still see a "stream:hello"
  // event on connect so they know the channel is alive.
  timer = setTimeout(tick, intervalMs);

  io.on('connection', (socket) => {
    socket.emit('stream:hello', {
      message: 'subscribed to stream',
      event,
      intervalMs,
      connectedAt: new Date().toISOString(),
    });
  });

  return function stop() {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}

module.exports = { startExternalStream };
