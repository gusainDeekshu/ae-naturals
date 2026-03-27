// src/app/page.tsx
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/getQueryClient';

// Home Sections
import { 
  HeroBanner, 
  CategoryRow, 
  OccasionGrid,  
  SpecialOffer, 
  InfoCards, 
  EventGiftingGuide, 
  TeddyPromo, 
  Testimonials, 
  BlogSection,  
  WhatsAppCTA
} from "@/components/home/HomeSections";

// Import your new component
import { ProductShowcase } from "@/components/home/ProductShowcase";

export const revalidate = 600; 

export default async function Home() {
  const queryClient = getQueryClient();

  // 1. Prefetch using NATIVE FETCH (SSR Safe)
  await queryClient.prefetchQuery({
    queryKey: ['products', 'flower-fairy-dehradun', 'catalog'],
    queryFn: async () => {
      try {
        let backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
        if (backendUrl.startsWith('/')) {
           backendUrl = `http://localhost:4000${backendUrl}`;
        }

        const res = await fetch(`${backendUrl}/products/catalog/flower-fairy-dehradun`, {
          next: { revalidate: 600 } 
        });

        if (!res.ok) return [];

        const data = await res.json();
        const extractedData = data?.data || data;
        
        return Array.isArray(extractedData?.products) 
          ? extractedData.products 
          : (Array.isArray(extractedData) ? extractedData : []);

      } catch (error) {
        console.error("Failed to prefetch products on the server:", error);
        return []; 
      }
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-12 pb-20">
          
          <HeroBanner />
          <CategoryRow />
          <OccasionGrid />

          {/* 🔥 HOW TO SHOW PRODUCT SHOWCASE 🔥 */}
          {/* Example 1: Show the whole catalog / Best Sellers (No category passed) */}
          <ProductShowcase title="Trending Best Sellers"  category="red-velvet-roses"/>
          
          {/* Example 2: Filter specifically by the 'cakes' slug */}
          <ProductShowcase title="Fresh Birthday Cakes" category="cakes" />
          
          {/* Example 3: Filter specifically by the 'roses' slug */}
          <ProductShowcase title="Premium Roses" category="roses" />

          <SpecialOffer />
          <InfoCards />
          <EventGiftingGuide />
          <TeddyPromo />
          <Testimonials />
          <BlogSection />
          <WhatsAppCTA />
          
        </div>
      </main>
    </HydrationBoundary>
  );
}