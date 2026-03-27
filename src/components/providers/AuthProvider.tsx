// src/components/providers/AuthProvider.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import apiClient from "@/lib/api-client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, logout, _hasHydrated } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 🔥 This is the "Magic" call. 
        // It sends the HTTP-Only cookie to the backend.
        // The backend verifies it and returns a fresh access_token.
        const res = await apiClient.get("/auth/me");
        
        if (res && res.access_token) {
          setAuth(res.user, res.access_token);
        }
      } catch (err) {
        // If the cookie is expired or missing, we just clear the state
        console.log("No active session found on boot.");
        logout();
      } finally {
        setLoading(false);
      }
    };

    if (_hasHydrated) {
      initAuth();
    }
  }, [_hasHydrated, setAuth, logout]);

  if (!_hasHydrated || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <p className="text-[#006044] font-bold animate-pulse">Restoring Session...</p>
      </div>
    );
  }

  return <>{children}</>;
}