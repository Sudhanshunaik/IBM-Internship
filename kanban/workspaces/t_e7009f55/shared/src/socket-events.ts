/**
 * Socket.IO event name constants and payload types.
 *
 * Both client and server import from here so a typo on either side is a TS error.
 */

export const SocketEvents = {
  // Client -> Server
  SubscribeScene: 'scene:subscribe',
  UnsubscribeScene: 'scene:unsubscribe',
  SubscribeDataSource: 'datasource:subscribe',
  UnsubscribeDataSource: 'datasource:unsubscribe',

  // Server -> Client
  DataPointBatch: 'datapoint:batch',
  DataPointAppend: 'datapoint:append',
  SceneUpdated: 'scene:updated',
  PresenceJoin: 'presence:join',
  PresenceLeave: 'presence:leave',
  Error: 'socket:error',
} as const;

export type SocketEventName = typeof SocketEvents[keyof typeof SocketEvents];

/** Subscribe to a scene's data feed. */
export interface SubscribeScenePayload {
  sceneId: string;
}

/** Subscribe to a single data source. */
export interface SubscribeDataSourcePayload {
  dataSourceId: string;
}

/** Batch of new data points for a scene. */
export interface DataPointBatchPayload {
  sceneId: string;
  dataSourceId: string;
  points: Array<{
    x: number;
    y: number;
    z: number;
    value?: number;
    meta?: Record<string, string | number | boolean | null>;
    timestamp: string; // ISO
  }>;
  receivedAt: string; // ISO
}

/** Single-point append (used for low-frequency updates). */
export interface DataPointAppendPayload {
  sceneId: string;
  dataSourceId: string;
  point: DataPointBatchPayload['points'][number];
}

/** Notifies subscribers that a scene was modified. */
export interface SceneUpdatedPayload {
  sceneId: string;
  byUserId: string;
  at: string; // ISO
}

/** Presence notification. */
export interface PresencePayload {
  sceneId: string;
  userId: string;
  username: string;
  at: string; // ISO
}

/** Server-emitted error to a single client. */
export interface SocketErrorPayload {
  event: SocketEventName;
  code: string;
  message: string;
}