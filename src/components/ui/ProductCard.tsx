"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { AddToCartButton } from "@/components/product/AddToCartButton";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[];
    rating?: number;
    reviewCount?: number;
    category?: { name: string } | string;
    variants: any[]; // Strictly required in the new architecture
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  // 1. Derive base pricing entirely from variants
  const variants = product.variants || [];

  const cheapestVariant =
    variants.length > 0
      ? variants.reduce(
          (prev, curr) => (prev.price < curr.price ? prev : curr),
          variants[0],
        )
      : null;

  const currentPrice = cheapestVariant?.price || 0;
  const oldPrice = cheapestVariant?.oldPrice;

  // 2. Calculate discount safely from the variant's prices
  const discountPercent =
    oldPrice && oldPrice > currentPrice
      ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100)
      : 0;

  // Logic for category name
  const categoryName =
    typeof product.category === "string"
      ? product.category
      : product.category?.name;

  // Default to the first variant if available for the AddToCart payload
  const [selectedVariant] = useState(variants[0] || null);

  return (
    <article
      className="
        group relative flex flex-col h-full rounded-2xl border border-neutral-200 
        bg-white overflow-hidden transition-all duration-300 
        hover:shadow-lg hover:-translate-y-0.5
        focus-within:ring-2 focus-within:ring-black/10
      "
    >
      {/* IMAGE SECTION */}
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-[4/5] bg-neutral-100 overflow-hidden"
        aria-label={product.name}
      >
        <Image
          src={product.images?.[0] || "/placeholder-product.png"}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {discountPercent > 0 && (
          <span className="absolute top-2 left-2 z-10 rounded-md bg-red-600 text-white text-[10px] font-semibold px-2 py-1">
            {discountPercent}% OFF
          </span>
        )}
      </Link>

      {/* CONTENT SECTION */}
      <div className="flex flex-col flex-grow p-3 sm:p-4">
        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1 mb-1 text-xs text-neutral-600">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{product.rating.toFixed(1)}</span>
            {product.reviewCount && (
              <span className="text-neutral-400">({product.reviewCount})</span>
            )}
          </div>
        )}

        {/* Title */}
        <Link href={`/product/${product.slug}`}>
          <h3 className="text-sm sm:text-base font-medium text-neutral-900 leading-snug line-clamp-2 transition-colors duration-200 group-hover:text-neutral-700">
            {product.name}
          </h3>
        </Link>

        {/* Category */}
        {categoryName && (
          <p className="text-xs text-neutral-500 mt-0.5 truncate">
            {categoryName}
          </p>
        )}

        <div className="flex-grow" />

        {/* Pricing (Derived strictly from Variants) */}
        <div className="mt-3 flex items-baseline gap-2">
          {variants.length > 1 && (
            <span className="text-xs font-medium text-neutral-500">From</span>
          )}
          <span className="text-base sm:text-lg font-semibold text-neutral-900">
            ₹{currentPrice.toLocaleString("en-IN")}
          </span>
          {oldPrice && (
            <span className="text-xs sm:text-sm text-neutral-400 line-through">
              ₹{oldPrice.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {/* CTA SECTION */}
        <div className="mt-3">
          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              price: currentPrice, // Injected resolved variant price
              images: product.images,
              variants: variants,
            }}
            variantId={selectedVariant?.id}
            stock={selectedVariant?.stock || 0} // Injected resolved variant stock
          />
        </div>
      </div>
    </article>
  );
}
