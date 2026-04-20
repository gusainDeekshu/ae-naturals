// src/components/home/HomeRenderer.tsx

"use client";

import React from "react";
import { HeroBanner } from "@/components/home/HeroBanner";

import HomeBlogSection from "@/components/home/HomeBlogSection";
import { ProductCarousel } from "./ProductCarousel";
import { PromotionalBanner } from "./PromotionalBanner";
import { TrustTicker } from "./TrustTicker";
import { CategoryShowcase } from "./CategoryShowcase";
import { BrandStory } from "./BrandStory";

// 🌟 Dynamic Section Map
const SECTION_MAP: Record<string, React.FC<any>> = {
  HERO: HeroBanner,
  CATEGORIES: CategoryShowcase,
  PRODUCT_CAROUSEL: ProductCarousel, // Used for Bestsellers, Deals, etc.
  PROMO_BANNER: PromotionalBanner, 
  TRUST_BADGES: TrustTicker,
  BRAND_STORY: BrandStory,
  BLOG_SECTION: HomeBlogSection,
};

interface HomeRendererProps {
  config: {
    sectionsOrder: Array<{
      id: string;
      type: string;
      settings?: any; // e.g., { title: "Bestsellers", showViewAll: true }
    }>;
  };
  data: any;
}

export default function HomeRenderer({ config, data }: HomeRendererProps) {
  if (!config?.sectionsOrder || !Array.isArray(config.sectionsOrder)) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-gray-400 font-medium tracking-widest uppercase text-sm">
        Storefront Initializing...
      </div>
    );
  }

  return (
    <main className="w-full flex flex-col gap-y-16 md:gap-y-24 pb-20 bg-white">
      {config.sectionsOrder.map((section) => {
        const Component = SECTION_MAP[section.type];

        if (!Component) {
          console.warn(`[HomeRenderer] Unmapped CMS section: ${section.type}`);
          return null;
        }

        // 🌟 Map the data dynamically based on what the section needs
        let sectionData: any = null;

        switch (section.type) {
          case "HERO":
            sectionData = data.banners || [];
            break;
          case "CATEGORIES":
            sectionData = data.collections || [];
            break;
          case "PRODUCT_CAROUSEL":
            // Admin can use settings.dataSource to pick which array to map
            const source = section.settings?.dataSource || "featuredProducts";
            sectionData = data[source] || [];
            break;
          case "PROMO_BANNER":
            sectionData = section.settings; // Banners usually live entirely in settings
            break;
          case "BRAND_STORY":
            sectionData = section.settings;
            break;
          case "BLOG_SECTION":
            sectionData = data.blogs || [];
            break;
          case "TRUST_BADGES":
            sectionData = []; // Purely static or pulled from global config
            break;
        }

        return (
          <section key={section.id} className="w-full">
            <Component
              data={sectionData}
              settings={section.settings || {}}
            />
          </section>
        );
      })}
    </main>
  );
}