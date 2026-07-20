import { Server as IOServer, type Socket } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import {
  SocketEvents,
  type SubscribeScenePayload,
  type SubscribeDataSourcePayload,
  type DataPointBatchPayload,
  type DataPointAppendPayload,
  type SceneUpdatedPayload,
  type PresencePayload,
  type SocketErrorPayload,
  type JwtAccessPayload,
} from '@mern-3dviz/shared';
import { verifyAccessToken } from '../auth/tokens';
import { logger } from '../config/logger';
import { env } from '../config/env';

const SCENE_ROOM = (sceneId: string) => `scene:${sceneId}`;
const DS_ROOM = (dataSourceId: string) => `datasource:${dataSourceId}`;

/** A user is tracked in a presence map keyed by sceneId. */
const presence = new Map<string, Map<string, string>>(); // sceneId -> userId -> username

export function createSocketServer(httpServer: HttpServer): IOServer {
  const io = new IOServer(httpServer, {
    path: env.SOCKET_PATH,
    cors: {
      origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
      credentials: true,
    },
    pingTimeout: env.SOCKET_PING_TIMEOUT_MS,
    pingInterval: env.SOCKET_PING_INTERVAL_MS,
  });

  // Auth middleware — accept token via handshake auth or query.
  io.use((socket, next) => {
    const fromAuth = (socket.handshake.auth?.token as string | undefined) ?? '';
    const fromQuery = (socket.handshake.query.token as string | undefined) ?? '';
    const token = fromAuth || fromQuery;
    if (!token) {
      // Allow anonymous sockets to subscribe to public data only — for the prototype
      // we still require auth, matching REST.
      next(new Error('auth/missing-token'));
      return;
    }
    try {
      const payload = verifyAccessToken(token);
      (socket.data as { auth?: JwtAccessPayload }).auth = payload;
      next();
    } catch {
      next(new Error('auth/invalid-token'));
    }
  });

  io.on('connection', (socket) => {
    const auth = (socket.data as { auth?: JwtAccessPayload }).auth;
    logger.info({ sid: socket.id, userId: auth?.sub }, 'socket connected');

    socket.on(SocketEvents.SubscribeScene, (payload: SubscribeScenePayload) => {
      if (!payload?.sceneId) {
        emitSocketError(socket, SocketEvents.SubscribeScene, 'validation/missing-sceneId', 'sceneId required');
        return;
      }
      const room = SCENE_ROOM(payload.sceneId);
      void socket.join(room);
      announcePresence(payload.sceneId, auth?.sub ?? 'anon', auth?.email?.split('@')[0] ?? 'anonymous', 'join');
    });

    socket.on(SocketEvents.UnsubscribeScene, (payload: SubscribeScenePayload) => {
      if (!payload?.sceneId) return;
      void socket.leave(SCENE_ROOM(payload.sceneId));
      announcePresence(payload.sceneId, auth?.sub ?? 'anon', auth?.email?.split('@')[0] ?? 'anonymous', 'leave');
    });

    socket.on(SocketEvents.SubscribeDataSource, (payload: SubscribeDataSourcePayload) => {
      if (!payload?.dataSourceId) {
        emitSocketError(socket, SocketEvents.SubscribeDataSource, 'validation/missing-dataSourceId', 'dataSourceId required');
        return;
      }
      void socket.join(DS_ROOM(payload.dataSourceId));
    });

    socket.on(SocketEvents.UnsubscribeDataSource, (payload: SubscribeDataSourcePayload) => {
      if (!payload?.dataSourceId) return;
      void socket.leave(DS_ROOM(payload.dataSourceId));
    });

    socket.on('disconnect', (reason) => {
      logger.info({ sid: socket.id, reason }, 'socket disconnected');
      // Best-effort: remove from all scene presence maps.
      for (const sceneId of presence.keys()) {
        if (presence.get(sceneId)?.has(auth?.sub ?? '')) {
          announcePresence(sceneId, auth?.sub ?? 'anon', auth?.email?.split('@')[0] ?? 'anonymous', 'leave');
        }
      }
    });
  });

  return io;
}

function announcePresence(sceneId: string, userId: string, username: string, kind: 'join' | 'leave'): void {
  const map = presence.get(sceneId) ?? new Map<string, string>();
  if (kind === 'join') map.set(userId, username);
  else map.delete(userId);
  presence.set(sceneId, map);
  const payload: PresencePayload = { sceneId, userId, username, at: new Date().toISOString() };
  getIo().to(SCENE_ROOM(sceneId)).emit(
    kind === 'join' ? SocketEvents.PresenceJoin : SocketEvents.PresenceLeave,
    payload
  );
}

function emitSocketError(socket: Socket, event: string, code: string, message: string): void {
  const payload: SocketErrorPayload = { event: event as SocketErrorPayload['event'], code, message };
  socket.emit(SocketEvents.Error, payload);
}

/** Singleton handle for use by controllers/workers that want to emit events. */
let ioRef: IOServer | null = null;
export function getIo(): IOServer {
  if (!ioRef) throw new Error('Socket.IO server not initialized');
  return ioRef;
}
export function setIo(io: IOServer): void {
  ioRef = io;
}

/** Emit helpers used by controllers. */
export const realtime = {
  emitDataPointBatch(payload: DataPointBatchPayload): void {
    getIo().to(SCENE_ROOM(payload.sceneId)).emit(SocketEvents.DataPointBatch, payload);
    getIo().to(DS_ROOM(payload.dataSourceId)).emit(SocketEvents.DataPointBatch, payload);
  },
  emitDataPointAppend(payload: DataPointAppendPayload): void {
    getIo().to(SCENE_ROOM(payload.sceneId)).emit(SocketEvents.DataPointAppend, payload);
    getIo().to(DS_ROOM(payload.dataSourceId)).emit(SocketEvents.DataPointAppend, payload);
  },
  emitSceneUpdated(payload: SceneUpdatedPayload): void {
    getIo().to(SCENE_ROOM(payload.sceneId)).emit(SocketEvents.SceneUpdated, payload);
  },
};