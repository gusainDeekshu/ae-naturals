//src\components\product\AddToCartButton.tsx


"use client";

import React, { useState } from "react";
import { ShoppingCart, Loader2, Plus, Minus } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    variants?: any[];
    stock?: number;
  };
  variantId?: string;
  stock?: number; 
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  product,
  variantId,
  stock: propStock,
}) => {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const [isProcessing, setIsProcessing] = useState(false);

  const calculateAvailableStock = () => {
    if (variantId && product.variants) {
      const selectedVariant = product.variants.find(v => v.id === variantId);
      return selectedVariant?.stock ?? 0;
    }
    if (product.variants && product.variants.length > 0) {
      return product.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
    }
    return propStock ?? product.stock ?? 0;
  };

  const availableStock = calculateAvailableStock();
  const cartItem = items.find(
    (item) => item.productId === product.id && (item.variantId || undefined) === (variantId || undefined)
  );
  const currentQuantity = cartItem?.quantity || 0;

  const handleAddInitial = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (availableStock <= 0) return;
    setIsProcessing(true);
    await addItem({
      productId: product.id,
      variantId,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || "",
      quantity: 1,
    });
    setIsProcessing(false);
  };

  const handleIncrease = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentQuantity >= availableStock) return;
    setIsProcessing(true);
    await updateQuantity(product.id, currentQuantity + 1, variantId);
    setIsProcessing(false);
  };

  const handleDecrease = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsProcessing(true);
    if (currentQuantity === 1) {
      await removeItem(product.id, variantId);
    } else {
      await updateQuantity(product.id, currentQuantity - 1, variantId);
    }
    setIsProcessing(false);
  };

  // Common styles for both states
  const btnBase = "w-full rounded-lg sm:rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center overflow-hidden";
  const heightClass = "h-9 sm:h-12";

  /* ---------------- UI STATES ---------------- */

  if (availableStock <= 0) {
    return (
      <button
        disabled
        className={cn(btnBase, heightClass, "bg-zinc-100 text-zinc-400 text-[10px] sm:text-xs font-bold border border-zinc-200 cursor-not-allowed")}
      >
        OUT OF STOCK
      </button>
    );
  }

  if (currentQuantity > 0) {
    return (
      <div
        className={cn(btnBase, heightClass, "border-2 border-[#006044] bg-white px-0.5 sm:px-1")}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        <button
          onClick={handleDecrease}
          disabled={isProcessing}
          className="h-full w-8 sm:w-12 flex items-center justify-center text-[#006044] hover:bg-zinc-50 shrink-0"
        >
          <Minus className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[3px]" />
        </button>

        <span className="flex-1 text-sm sm:text-lg font-black text-[#006044] text-center min-w-[20px]">
          {isProcessing ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mx-auto" /> : currentQuantity}
        </span>

        <button
          onClick={handleIncrease}
          disabled={isProcessing || currentQuantity >= availableStock}
          className="h-full w-8 sm:w-12 flex items-center justify-center text-[#006044] hover:bg-zinc-50 shrink-0 disabled:opacity-30"
        >
          <Plus className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[3px]" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleAddInitial}
      disabled={isProcessing}
      className={cn(btnBase, heightClass, "bg-[#006044] text-white hover:bg-[#004d36] shadow-md shadow-green-100/50 gap-1.5 sm:gap-3")}
    >
      {isProcessing ? (
        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
      ) : (
        <>
          <ShoppingCart className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          <span className="text-[10px] sm:text-sm font-black tracking-wider sm:tracking-widest uppercase">
            Add to Cart
          </span>
        </>
      )}
    </button>
  );
};