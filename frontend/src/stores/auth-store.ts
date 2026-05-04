import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { UserResponse } from '../types/user';

export interface AuthState {
  accessToken: string | null;
  user: UserResponse | null;
  setSession: (token: string, user: UserResponse | null) => void;
  setUser: (user: UserResponse | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setSession: (accessToken, user) => set({ accessToken, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ accessToken: null, user: null }),
    }),
    {
      name: 'historial_go_auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
    },
  ),
);
