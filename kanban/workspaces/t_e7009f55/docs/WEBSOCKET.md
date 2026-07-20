# WebSocket event contract

Real-time channel uses **Socket.IO** at the path configured by `SOCKET_PATH`
(default `/socket.io`). The client opens a single socket and joins rooms by id.

## Authentication

The JWT access token is sent in the handshake:

```ts
import { io } from 'socket.io-client';

const socket = io(API_URL, {
  path: '/socket.io',
  auth: { token: accessToken }, // sent via handshake.auth
  // OR: query: { token: accessToken }
});
```

The server verifies the token before allowing the connection. On failure the
connect attempt is rejected with an `auth/*` error message.

## Events

All event name constants live in `@mern-3dviz/shared` (`SocketEvents`). Both
client and server import them so a typo is a TS error.

### Client → Server

| Event name              | Payload                                  | Effect                                                                 |
|-------------------------|------------------------------------------|------------------------------------------------------------------------|
| `scene:subscribe`       | `{ sceneId: string }`                    | Join the room `scene:<sceneId>`; server emits `presence:join`.         |
| `scene:unsubscribe`     | `{ sceneId: string }`                    | Leave the room; server emits `presence:leave`.                        |
| `datasource:subscribe`  | `{ dataSourceId: string }`               | Join the room `datasource:<id>` (raw point stream, no scene context).  |
| `datasource:unsubscribe`| `{ dataSourceId: string }`               | Leave the data source room.                                            |

### Server → Client

| Event name           | Payload                                                                                                   |
|----------------------|-----------------------------------------------------------------------------------------------------------|
| `datapoint:batch`    | `{ sceneId, dataSourceId, points: DataPoint[], receivedAt }`                                              |
| `datapoint:append`   | `{ sceneId, dataSourceId, point: DataPoint }`                                                             |
| `scene:updated`      | `{ sceneId, byUserId, at }`                                                                               |
| `presence:join`      | `{ sceneId, userId, username, at }`                                                                       |
| `presence:leave`     | `{ sceneId, userId, username, at }`                                                                       |
| `socket:error`       | `{ event, code, message }`                                                                                 |

### Error model

The server emits `socket:error` to the offending client only when validation or
authorization on a subscription fails. The `event` field references the offending
incoming event name. Common codes:

- `validation/missing-sceneId`
- `validation/missing-dataSourceId`
- `auth/missing-token` (handshake)
- `auth/invalid-token` (handshake)

## Rooms

- `scene:<sceneId>` — receives all data-point events for that scene and presence
  notifications.
- `datasource:<dataSourceId>` — receives raw data-point events for that source.

## Example client code

```ts
import { io, Socket } from 'socket.io-client';
import { SocketEvents, type DataPointBatchPayload } from '@mern-3dviz/shared';

const socket: Socket = io(API_URL, {
  path: '/socket.io',
  auth: { token: accessToken },
});

socket.on('connect', () => {
  socket.emit(SocketEvents.SubscribeScene, { sceneId });
});

socket.on(SocketEvents.DataPointBatch, (payload: DataPointBatchPayload) => {
  // push payload.points into your scene buffer
});
```

## Backpressure / limits

- A scene room receives batches at the rate configured on each data source
  (`pollIntervalMs`, default `2000` ms in the simulator).
- The client caps the live point buffer at **5000 points** (configurable in
  `client/src/store/sceneFeed.ts`); older points are dropped.
- The server enforces `RATE_LIMIT_MAX` per IP per `RATE_LIMIT_WINDOW_MS` across
  REST + WS upgrade combined via `express-rate-limit` on the HTTP layer.