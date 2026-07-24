import { create } from 'zustand';
import { User } from '@/types';
import { api, setAccessToken } from '@/lib/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string, twoFactorCode?: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: 'STUDENT' | 'TEACHER';
    referralCode?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  setUser: (user) => set({ user }),

  login: async (email, password, twoFactorCode) => {
    set({ isLoading: true });
    try {
      const data = await api.post<{ user: User; accessToken: string }>('/auth/login', {
        email,
        password,
        twoFactorCode,
      });
      setAccessToken(data.accessToken);
      set({ user: data.user, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  loginWithGoogle: async (idToken) => {
    set({ isLoading: true });
    try {
      const data = await api.post<{ user: User; accessToken: string }>('/auth/google', { idToken });
      setAccessToken(data.accessToken);
      set({ user: data.user, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (input) => {
    set({ isLoading: true });
    try {
      const data = await api.post<{ user: User; accessToken: string }>('/auth/register', input);
      setAccessToken(data.accessToken);
      set({ user: data.user, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      set({ user: null });
    }
  },

  // Called once on app load: tries to silently refresh using the httpOnly
  // cookie, so a page reload doesn't log the user out.
  initialize: async () => {
    try {
      const data = await api.post<{ user: User; accessToken: string }>('/auth/refresh', undefined, {
        skipAuthRetry: true,
      });
      setAccessToken(data.accessToken);
      set({ user: data.user });
    } catch {
      set({ user: null });
    } finally {
      set({ isInitialized: true });
    }
  },
}));
