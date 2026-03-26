// src/hooks/useAuthInit.ts
"use client";

import { useEffect } from "react";
import { apiClient } from "@/lib/api-client"; //
import { useAuthStore } from "@/store/useAuthStore";
import { User, RefreshResponse } from "@/types/auth"; //

export const useAuthInit = () => {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setGuest = useAuthStore((s) => s.setGuest);

  useEffect(() => {
    const init = async () => {
      try {
        // Step 1: Attempt refresh using HttpOnly cookies
        const { data: refreshRes } = await apiClient.post<RefreshResponse>("/auth/refresh");
        
        if (refreshRes?.access_token) {
          setAccessToken(refreshRes.access_token);
        }

        // Step 2: Fetch profile to confirm session
        const { data: user } = await apiClient.get<User>("/auth/me");
        setAuth(user, refreshRes?.access_token || "");

      } catch (error) {
        // Fallback to guest mode if refresh token is missing/expired
        console.warn("👤 Guest Mode Activated");
        setGuest();
      }
    };

    init();
  }, [setAuth, setAccessToken, setGuest]);
};