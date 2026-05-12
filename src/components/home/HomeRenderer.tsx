// src/components/home/HomeRenderer.tsx

"use client";

import React from "react";

import { HeroBanner } from "./HeroBanner";
import { ProductCarousel } from "./ProductCarousel";
import { PromotionalBanner } from "./PromotionalBanner";
import { TrustTicker } from "./TrustTicker";
import { BrandStory } from "./BrandStory";
import { FeaturedProducts } from "./FeaturedProducts";
import { HomeBlogSection } from "./HomeBlogSection";
import { CollectionsShowcase } from "./CollectionsShowcase";
import { VideoShoppableSection } from "./VideoShoppableSection";
import { cn } from "@/lib/utils";

// SECTION REGISTRY
const SECTION_COMPONENTS: Record<string, React.FC<any>> = {
  HERO: HeroBanner,
  COLLECTIONS: CollectionsShowcase,
  FEATURED_PRODUCTS: FeaturedProducts,
  PRODUCT_CAROUSEL: ProductCarousel,
  PROMO_BANNER: PromotionalBanner,
  TRUST_BADGES: TrustTicker,
  BRAND_STORY: BrandStory,
  BLOG_SECTION: HomeBlogSection,
  VIDEO_SHOPPABLE: VideoShoppableSection,
};

interface HomeRendererProps {
  config: {
    sectionsOrder: any[];
  };
  data: any;
}

export default function HomeRenderer({
  config,
  data,
}: HomeRendererProps) {
  const sectionsToRender = config?.sectionsOrder || [];

  if (!sectionsToRender.length) return null;

  return (
    <div className="flex flex-col bg-white min-h-screen pb-24">
      {/* RENDER SECTIONS */}
      {sectionsToRender
        .filter((section: any) => section.isActive)
        .map((section: any) => {
          const Component = SECTION_COMPONENTS[section.type];

          if (!Component) return null;

          const resolvedData = resolveData(section, data);

          const isHeroSection = section.type === "HERO";

return (
  <section
    key={section.id}
    id={section.id}
    className={cn(
      "w-full",
      isHeroSection 
        ? "mt-0" // Flush with header
        : "mt-12 md:mt-20 px-4 md:px-0" // Maintain spacing for product sections
    )}
  >
    {/* If not hero, we wrap the component in the standard max-w container */}
    {isHeroSection ? (
      <Component
        data={resolvedData}
        settings={section.settings || {}}
      />
    ) : (
      <div className="max-w-7xl mx-auto">
        <Component
          data={resolvedData}
          settings={section.settings || {}}
        />
      </div>
    )}
  </section>
);        })}
    </div>
  );
}

/**
 * DATA RESOLVER
 * Ensures each section receives the proper backend data
 */
function resolveData(section: any, data: any) {
  const settings = section.settings || {};
  const sourceKey = settings.dataSource;

  switch (section.type) {
    case "FEATURED_PRODUCTS":
      return data?.featuredProducts || [];

    case "PRODUCT_CAROUSEL":
      if (sourceKey?.startsWith("collection_")) {
        const slug = sourceKey.replace("collection_", "");

        const targetCollection = data.collections?.find(
          (collection: any) => collection.slug === slug
        );

        return (
          targetCollection?.products?.map(
            (product: any) => product.product || product
          ) || []
        );
      }

      return data?.[sourceKey] || [];

    case "COLLECTIONS":
      return data?.collections || [];

    case "BLOG_SECTION":
      return data?.blogs || [];

    case "HERO":
    case "PROMO_BANNER":
      return data?.banners || [];

    case "VIDEO_SHOPPABLE":
      // Stored directly in admin block settings
      return settings.slides || [];

    default:
      return null;
  }
}