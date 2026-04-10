// src\components\home\HomeRenderer.tsx

"use client";

import React from 'react';

// --- IMPORTS ---
import { HeroBanner } from '@/components/home/HeroBanner';
import { CategoryTabs } from '@/components/home/CategoryTabs';
import { ProductGrid } from '@/components/home/ProductGrid';
import { BundleBuilder } from '@/components/home/BundleBuilder';
import { TrustBadges } from '@/components/home/TrustBadges';

const SECTION_MAP: Record<string, React.FC<any>> = {
  HERO: HeroBanner,
  CATEGORIES: CategoryTabs,
  FEATURED_PRODUCTS: ProductGrid,
  BUNDLE_BUILDER: BundleBuilder,
  TRUST_BADGES: TrustBadges,
};

interface HomeRendererProps {
  config: {
    sectionsOrder: Array<{
      id: string;
      type: string;
      settings?: any;
    }>;
  };
  data: any; 
}

export default function HomeRenderer({ config, data }: HomeRendererProps) {
  if (!config?.sectionsOrder || !Array.isArray(config.sectionsOrder)) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        No homepage configuration found.
      </div>
    );
  }

  return (
    <main className="w-full flex flex-col gap-y-8 pb-16">
      {config.sectionsOrder.map((section) => {
        const Component = SECTION_MAP[section.type];
        
        if (!Component) {
          console.warn(`[HomeRenderer] Missing component for section type: ${section.type}`);
          return null; 
        }
        
        // 🔥 THE FIX: Explicitly map the section type to the correct array from NestJS
        let sectionData: any[] = [];
        
        switch (section.type) {
          case 'HERO':
            sectionData = data.banners || [];
            break;
          case 'CATEGORIES':
            sectionData = data.categories || [];
            break;
          case 'FEATURED_PRODUCTS':
            sectionData = data.featuredProducts || [];
            break;
          case 'BUNDLE_BUILDER':
            // The bundle builder uses the featured products pool to let users build a box
            sectionData = data.featuredProducts || []; 
            break;
          case 'TRUST_BADGES':
            // Trust badges are static in our component, so it doesn't need API data
            sectionData = []; 
            break;
        }

        return (
          <Component 
            key={section.id} 
            data={sectionData} 
            settings={section.settings} 
          />
        );
      })}
    </main>
  );
}