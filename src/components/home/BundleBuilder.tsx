// src\components\home\BundleBuilder.tsx

"use client";

import React, { useState } from 'react';
import { Product } from '@/types/product';
import { ProductCard } from '@/components/ui/ProductCard';

interface BundleBuilderProps {
  data: Product[];
  settings?: {
    title?: string;
    subtitle?: string;
    bundleSize?: number;
    bundlePrice?: number;
  };
}

export const BundleBuilder = ({ data, settings }: BundleBuilderProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Default to 5 items for 999 if the CMS settings aren't provided
  const BUNDLE_SIZE = settings?.bundleSize || 5;
  const BUNDLE_PRICE = settings?.bundlePrice || 999;

  // Graceful fallback if no products are available for the bundle
  if (!data || data.length === 0) return null;

  const toggleProduct = (id: string) => {
    setSelectedIds((prev) => {
      // If already selected, remove it
      if (prev.includes(id)) {
        return prev.filter((p) => p !== id);
      }
      // If not selected and we haven't reached the limit, add it
      if (prev.length < BUNDLE_SIZE) {
        return [...prev, id];
      }
      // If limit reached, do nothing
      return prev;
    });
  };

  return (
    <section className="w-full bg-[#fbf9f6] py-16 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-black uppercase tracking-widest text-gray-900 md:text-3xl">
            {settings?.title || 'Build Your Own Box'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 md:text-base">
            {settings?.subtitle || `Pick any ${BUNDLE_SIZE} products for only ₹${BUNDLE_PRICE}`}
          </p>
        </div>

        {/* Selection Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {data.map((product) => {
            const isSelected = selectedIds.includes(product.id);
            return (
              <div 
                key={product.id} 
                onClick={() => toggleProduct(product.id)}
                className={`relative cursor-pointer transition-all duration-300 ${
                  isSelected 
                    ? 'scale-[1.02] ring-4 ring-green-600 ring-offset-2' 
                    : 'hover:scale-[1.01] hover:shadow-lg'
                }`}
              >
                {/* Visual Indicator of Selection */}
                {isSelected && (
                  <div className="absolute -right-3 -top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white shadow-md">
                    ✓
                  </div>
                )}
                
                {/* Pointer events none ensures the click registers on the wrapper, not the buttons inside the card */}
                <div className="pointer-events-none h-full w-full">
                  <ProductCard product={product} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Action Bar (Appears when user starts selecting) */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom border-t border-gray-200 bg-white p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                  Your Box Status
                </span>
                <span className="text-xl font-black text-green-700">
                  {selectedIds.length} / {BUNDLE_SIZE} Selected
                </span>
              </div>
              
              <button 
                disabled={selectedIds.length !== BUNDLE_SIZE}
                className={`w-full px-8 py-4 text-sm font-black uppercase tracking-widest sm:w-auto transition-all ${
                  selectedIds.length === BUNDLE_SIZE 
                    ? 'bg-black text-white hover:bg-green-700 shadow-xl' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {selectedIds.length === BUNDLE_SIZE 
                  ? `Add Box to Cart — ₹${BUNDLE_PRICE}` 
                  : `Select ${BUNDLE_SIZE - selectedIds.length} more items`
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};