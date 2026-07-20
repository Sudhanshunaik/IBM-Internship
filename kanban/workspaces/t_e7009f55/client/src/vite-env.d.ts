/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SOCKET_PATH?: string;
  readonly VITE_DEFAULT_SCENE_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}