import { headers } from "next/headers";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/getQueryClient";

// 🔥 The ONLY import you need now for the homepage layout!
import HomeRenderer from "@/components/home/HomeRenderer";
import { apiClient } from "@/lib/api-client";

export const revalidate = 600;

export default async function Home() {
  const queryClient = getQueryClient();

  // 1. Multi-Tenant SSR Logic: Extract the domain
  const headersList = await headers();
  const domain =
    headersList.get("x-forwarded-host") ||
    headersList.get("host") ||
    "localhost";

  // 2. Fetch the Aggregated Homepage Data from NestJS
  // Note: We use fetchQuery instead of prefetchQuery so we can extract the config immediately
  const homeData = await queryClient.fetchQuery({
  
    queryKey: ["home-data", domain],
    queryFn: async () => {
      try {
        let backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
        if (backendUrl.startsWith("/")) {
          backendUrl = `http://localhost:4000${backendUrl}`;
        }

        // 🔥 Using Axios (apiClient) instead of native fetch
        const response = await apiClient.get(`${backendUrl}/admin/stores/home`, {
          headers: {
            "x-tenant-domain": domain, // Tells the backend which store's themeConfig to load
          },
        });
        console.log("[SSR] Fetched homepage data for domain:", domain, response.data);
        // Axios automatically parses JSON and stores it in the `data` property.
        // It also automatically throws on 4xx/5xx responses, so we don't need `if (!res.ok)`.
        return response.data;
      } catch (error) {
        console.error("[SSR] Failed to fetch homepage aggregator data:", error);
        return null;
      }
    },
  });

  // 3. Graceful Fallback if the API is down
  if (!homeData || !homeData.config) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold uppercase tracking-widest text-gray-800">Store Unavailable</h1>
          <p className="mt-2 text-gray-500">We are currently updating our storefront. Please check back later.</p>
        </div>
      </main>
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="min-h-screen bg-white">
        {/* 🔥 ALL HARDCODED SECTIONS ARE GONE! 🔥
          The HomeRenderer now loops through `homeData.config.sectionsOrder` 
          and renders the exact components your Admin Panel dictates.
        */}
        <HomeRenderer 
          config={homeData.config} 
          data={homeData.data} 
        />
      </main>
    </HydrationBoundary>
  );
}