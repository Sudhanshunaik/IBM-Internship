import { create } from 'zustand';
import type { AuthResponse, AuthTokens, LoginRequest, RegisterRequest, PublicUser } from '@mern-3dviz/shared';
import { authApi, setAccessToken } from '../api/client';

interface AuthState {
  user: PublicUser | null;
  tokens: AuthTokens | null;
  hydrating: boolean;
  hydrate: () => Promise<void>;
  register: (body: RegisterRequest) => Promise<void>;
  login: (body: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tokens: null,
  hydrating: true,

  hydrate: async () => {
    try {
      // Try to refresh from cookie; if it works we know the user is logged in.
      const { tokens } = await authApi.refresh({ refreshToken: '' });
      setAccessToken(tokens.accessToken);
      const { user } = await authApi.me();
      set({ user, tokens, hydrating: false });
    } catch {
      setAccessToken(null);
      set({ user: null, tokens: null, hydrating: false });
    }
  },

  register: async (body) => {
    const res: AuthResponse = await authApi.register(body);
    setAccessToken(res.tokens.accessToken);
    set({ user: res.user, tokens: res.tokens });
  },

  login: async (body) => {
    const res: AuthResponse = await authApi.login(body);
    setAccessToken(res.tokens.accessToken);
    set({ user: res.user, tokens: res.tokens });
  },

  logout: async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    setAccessToken(null);
    set({ user: null, tokens: null });
  },
}));