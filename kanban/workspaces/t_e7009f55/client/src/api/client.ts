import axios, { type AxiosInstance } from 'axios';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshRequest,
  AuthTokens,
  Page,
  Scene,
  CreateSceneRequest,
  UpdateSceneRequest,
  DataSource,
  CreateDataSourceRequest,
  DataPoint,
} from '@mern-3dviz/shared';

const baseURL = import.meta.env.VITE_API_URL ?? '';

export const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true, // for refresh_token cookie
});

let memoryAccessToken: string | null = null;
export function setAccessToken(token: string | null): void {
  memoryAccessToken = token;
}

api.interceptors.request.use((config) => {
  if (memoryAccessToken) {
    config.headers.set('Authorization', `Bearer ${memoryAccessToken}`);
  }
  return config;
});

/** Auth */
export const authApi = {
  register: (body: RegisterRequest) => api.post<AuthResponse>('/api/auth/register', body).then((r) => r.data),
  login:    (body: LoginRequest)    => api.post<AuthResponse>('/api/auth/login',    body).then((r) => r.data),
  refresh:  (body: RefreshRequest)  => api.post<{ tokens: AuthTokens }>('/api/auth/refresh', body).then((r) => r.data),
  logout:   ()                       => api.post('/api/auth/logout').then((r) => r.data),
  me:       ()                       => api.get<{ user: AuthResponse['user'] }>('/api/auth/me').then((r) => r.data),
};

/** Scenes */
export const sceneApi = {
  list:   (params?: { page?: number; pageSize?: number; ownerId?: string }) =>
    api.get<Page<Scene>>('/api/scenes', { params }).then((r) => r.data),
  get:    (id: string)                       => api.get<{ scene: Scene }>(`/api/scenes/${id}`).then((r) => r.data),
  create: (body: CreateSceneRequest)         => api.post<{ scene: Scene }>('/api/scenes', body).then((r) => r.data),
  update: (id: string, body: UpdateSceneRequest) =>
    api.put<{ scene: Scene }>(`/api/scenes/${id}`, body).then((r) => r.data),
  remove: (id: string)                       => api.delete(`/api/scenes/${id}`).then((r) => r.data),
};

/** Data sources */
export const dataSourceApi = {
  list:   (params?: { page?: number; pageSize?: number }) =>
    api.get<Page<DataSource>>('/api/datasources', { params }).then((r) => r.data),
  create: (body: CreateDataSourceRequest) => api.post<{ dataSource: DataSource }>('/api/datasources', body).then((r) => r.data),
  remove: (id: string) => api.delete(`/api/datasources/${id}`).then((r) => r.data),
};

/** Data points */
export const dataPointApi = {
  list: (params?: { dataSourceId?: string; page?: number; pageSize?: number }) =>
    api.get<Page<DataPoint>>('/api/datapoints', { params }).then((r) => r.data),
};