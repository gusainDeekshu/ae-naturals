// src/components/providers/AuthProvider.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { apiClient } from "@/lib/api-client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, logout, _hasHydrated } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Ensure your backend returns { user: {...}, access_token: "..." }
        const { data } = await apiClient.get("/auth/me");
        
        // DEBUG: console.log("User Data from API:", data);
        
        // Make sure you aren't passing data.user.user by mistake
        setAuth(data.user || data, data.access_token || ""); 
      } catch (err) {
        console.error("No session found or session expired");
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [setAuth, logout]);

  // Wait for BOTH the API check and the Zustand Hydration to finish
  if (loading || !_hasHydrated) {
    return (
      <div className="h-screen flex items-center justify-center bg-white font-bold text-[#006044]">
        🌸 Loading Session...
      </div>
    );
  }

  return <>{children}</>;
}