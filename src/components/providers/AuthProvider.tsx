// src/components/providers/AuthProvider.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "axios"; 
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, logout, _hasHydrated } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {},
          { withCredentials: true } 
        );

        // 1. Restore Auth State
        setAuth(data.user, data.access_token);
        
        // 🔥 FIX: ON PAGE REFRESH, ONLY FETCH! NEVER SYNC!
        // Because Zustand persists the DB cart in local storage, calling syncCart 
        // here would blindly send those saved items back to the backend, causing 
        // the database quantities to double on every refresh.
        const { fetchCart } = useCartStore.getState();
        await fetchCart(); 

      } catch (err) {
        console.warn("No active session. Remaining as guest.");
        logout();
      } finally {
        setLoading(false);
      }
    };

    if (_hasHydrated) {
      initAuth();
    }
  }, [_hasHydrated, setAuth, logout]);

  return <>{children}</>;
}