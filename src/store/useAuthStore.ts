import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as Sentry from "@sentry/nextjs";
import { BRAND } from "@/config/brand.config";

interface User {
  id: string;
  email: string;
  role: string;
  name: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setAuth: (user: User, token: string | null) => void; 
  setAccessToken: (token: string) => void;
  setGuest: () => void;
  setHasHydrated: (state: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setAuth: (user, token) => {
        Sentry.setUser({ id: user.id, email: user.email, role: user.role });
        set({
          user,
          accessToken: token,
          isAuthenticated: !!token, 
        });
      },

      setAccessToken: (token) => set({ accessToken: token, isAuthenticated: true }),

      setGuest: () => {
        Sentry.setUser(null);
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      logout: () => {
        Sentry.setUser(null);
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: `${BRAND.useStoreName}-auth`, // Unique name for auth storage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user,
        accessToken: state.accessToken, 
        isAuthenticated: state.isAuthenticated 
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);