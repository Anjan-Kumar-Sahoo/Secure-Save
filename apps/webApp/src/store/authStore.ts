import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id?: string;
  email: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  token: string | null;
  rememberedEmail: string | null;
  setAuth: (user: UserProfile, token: string) => void;
  rememberEmail: (email: string) => void;
  clearRememberedEmail: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      rememberedEmail: null,
      setAuth: (user, token) => set({
        isAuthenticated: true,
        user,
        token,
        rememberedEmail: user?.email ? user.email.trim().toLowerCase() : null,
      }),
      rememberEmail: (email) => set({ rememberedEmail: email.trim().toLowerCase() }),
      clearRememberedEmail: () => set({ rememberedEmail: null }),
      logout: () => set({
        isAuthenticated: false,
        user: null,
        token: null,
      }),
    }),
    {
      name: 'secure-save-auth',
      // Only persist the convenience preference (rememberedEmail)
      // Every fresh app launch requires entering Login PIN
      partialize: (state) => ({
        rememberedEmail: state.rememberedEmail,
      }),
    }
  )
);
