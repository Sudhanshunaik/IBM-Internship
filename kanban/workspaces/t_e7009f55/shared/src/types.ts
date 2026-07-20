/**
 * Domain models shared between server and client.
 *
 * Server uses these as the canonical shape persisted in MongoDB and returned by REST.
 * Client uses these for typed fetch responses, state slices, and Socket.IO event payloads.
 */

export type ISODateString = string;
export type ObjectIdString = string;

/** User account. Password hashes never leave the server. */
export interface User {
  _id: ObjectIdString;
  email: string;
  username: string;
  role: 'user' | 'admin';
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** Public-facing user shape (no internal fields). */
export type PublicUser = Omit<User, never>;

/** Auth request / response payloads. */
export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds until accessToken expires
}

export interface AuthResponse {
  user: PublicUser;
  tokens: AuthTokens;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface JwtAccessPayload {
  sub: ObjectIdString;       // user id
  email: string;
  role: 'user' | 'admin';
  iat: number;
  exp: number;
}

export interface JwtRefreshPayload {
  sub: ObjectIdString;
  tokenVersion: number;
  iat: number;
  exp: number;
}

/** A persisted 3D scene. */
export interface Scene {
  _id: ObjectIdString;
  ownerId: ObjectIdString;
  title: string;
  description?: string;
  /** Array of data source ids this scene subscribes to. */
  dataSourceIds: ObjectIdString[];
  /** Initial camera pose. */
  camera: {
    position: [number, number, number];
    target: [number, number, number];
    fov: number;
  };
  /** Visibility flag. */
  isPublic: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CreateSceneRequest {
  title: string;
  description?: string;
  camera?: Partial<Scene['camera']>;
  dataSourceIds?: ObjectIdString[];
  isPublic?: boolean;
}

export interface UpdateSceneRequest {
  title?: string;
  description?: string;
  camera?: Partial<Scene['camera']>;
  dataSourceIds?: ObjectIdString[];
  isPublic?: boolean;
}

/** A streaming data source that produces real-time DataPoints. */
export type DataSourceKind = 'sensor' | 'api-poll' | 'manual';

export interface DataSource {
  _id: ObjectIdString;
  ownerId: ObjectIdString;
  name: string;
  kind: DataSourceKind;
  /** Polling interval in ms (only relevant when kind === 'api-poll'). */
  pollIntervalMs?: number;
  /** External URL to poll (only relevant when kind === 'api-poll'). */
  endpoint?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CreateDataSourceRequest {
  name: string;
  kind: DataSourceKind;
  pollIntervalMs?: number;
  endpoint?: string;
}

/** A single 3D data point plotted in the scene. */
export interface DataPoint {
  _id: ObjectIdString;
  dataSourceId: ObjectIdString;
  /** Spatial coords. */
  x: number;
  y: number;
  z: number;
  /** Optional value driving color/size in the 3D view. */
  value?: number;
  /** Arbitrary metadata for hover tooltips. */
  meta?: Record<string, string | number | boolean | null>;
  timestamp: ISODateString;
}

/** Paginated list envelope. */
export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

/** Standard error response shape. */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/** Health probe. */
export interface HealthResponse {
  status: 'ok' | 'degraded';
  uptimeSeconds: number;
  mongo: 'connected' | 'disconnected';
  socket: 'ok' | 'down';
  version: string;
  timestamp: ISODateString;
}