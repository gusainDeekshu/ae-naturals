"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductVariant ,Product} from '@/types/product';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  // 1. Initial State: Handle potential empty variant arrays gracefully
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );

  // 2. Pricing Logic: Calculate dynamic price based on selected variant
  const currentPrice = selectedVariant 
    ? product.price + selectedVariant.priceModifier 
    : product.price;

  // 3. Discount Logic: Handle null oldPrice safely
  const discountPercentage = product.oldPrice 
    ? Math.round(((product.oldPrice - currentPrice) / product.oldPrice) * 100) 
    : null;

  return (
    <div className="group relative flex h-full flex-col border border-gray-100 bg-white transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
      
      {/* --- Image Section --- */}
      <Link 
        href={`/product/${product.slug}`} 
        className="relative aspect-[4/5] w-full overflow-hidden bg-gray-50 flex items-center justify-center"
      >
        <Image
          src={product.images?.[0] || '/placeholder-product.png'}
          alt={product.name}
          fill
          className="object-contain p-6 transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 50vw, 25vw"
          priority={false}
        />
        
        {/* Badges: WOW Style high-contrast labels */}
        <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
          {discountPercentage && discountPercentage > 0 && (
            <span className="bg-green-600 px-2 py-1 text-[10px] font-bold text-white shadow-sm">
              {discountPercentage}% OFF
            </span>
          )}
          {product.stock < 10 && product.stock > 0 && (
            <span className="bg-orange-500 px-2 py-1 text-[10px] font-bold text-white shadow-sm">
              ONLY {product.stock} LEFT
            </span>
          )}
        </div>

        {/* Floating Quick View: Slide-up UX */}
        <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-2 bg-white/90 py-3 backdrop-blur-sm transition-transform duration-300 group-hover:translate-y-0">
          <button className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-black hover:text-green-700">
            <Eye size={14} /> Quick View
          </button>
        </div>
      </Link>

      {/* --- Content Section --- */}
      <div className="flex flex-1 flex-col p-4 text-center">
        {/* Visual Trust: Star Rating */}
        <div className="mb-2 flex items-center justify-center gap-1 text-yellow-500">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              size={12} 
              fill={i < Math.floor(product.rating) ? "currentColor" : "none"} 
              className={i < Math.floor(product.rating) ? "" : "text-gray-300"}
            />
          ))}
          <span className="text-[10px] font-medium text-gray-400 ml-1">
            ({product.reviewCount})
          </span>
        </div>

        {/* Product Title: Truncated for layout consistency */}
        <Link href={`/product/${product.slug}`}>
          <h3 className="line-clamp-2 min-h-[40px] text-sm font-bold uppercase tracking-tight text-gray-900 transition-colors hover:text-green-700">
            {product.name}
          </h3>
        </Link>

        {/* Dynamic Pricing Display */}
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-lg font-black text-green-800">₹{currentPrice}</span>
          {product.oldPrice && (
            <span className="text-sm text-gray-400 line-through">₹{product.oldPrice}</span>
          )}
        </div>

        {/* Variant Selectors: Size/Weight selection without navigating */}
        {product.variants && product.variants.length > 1 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedVariant(v);
                }}
                className={cn(
                  "border px-2 py-1 text-[10px] font-bold transition-all min-w-[50px]",
                  selectedVariant?.id === v.id 
                    ? "border-black bg-black text-white" 
                    : "border-gray-200 text-gray-500 hover:border-gray-400"
                )}
              >
                {v.name}
              </button>
            ))}
          </div>
        )}

        {/* --- Action Section --- */}
        <div className="mt-auto pt-4">
          <button 
            disabled={product.stock === 0}
            className={cn(
              "flex w-full items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest transition-all",
              product.stock > 0 
                ? "bg-black text-white hover:bg-green-800 active:scale-95 shadow-md" 
                : "cursor-not-allowed bg-gray-100 text-gray-400"
            )}
          >
            <ShoppingCart size={16} />
            {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;