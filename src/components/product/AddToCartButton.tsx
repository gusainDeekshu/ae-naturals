// src/components/product/AddToCartButton.tsx

"use client";

import { useCart } from '@/hooks/useCart';
import React from 'react';
import { ShoppingCart, Loader2, Plus, Minus } from "lucide-react";

interface AddToCartButtonProps {
  productId: string;
  variantId?: string;
  stock?: number;
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({ productId, variantId, stock = 100 }) => {
  const { cart, addToCart, updateQuantity, removeItem } = useCart();

  // Find if item already exists in cart
  const cartItem = cart?.items?.find(
    (item: any) => item.productId === productId && item.variantId === (variantId || null)
  );

  const currentQuantity = cartItem?.quantity || 0;
  const isAdding = addToCart.isPending;
  const isUpdating = updateQuantity.isPending;

  const handleAddInitial = () => {
    if (stock <= 0) return;
    addToCart.mutate({ productId, variantId, quantity: 1 });
  };

  const handleIncrease = () => {
    if (currentQuantity >= stock) return;
    updateQuantity.mutate({ productId, variantId, quantity: currentQuantity + 1 });
  };

  const handleDecrease = () => {
    if (currentQuantity === 1) {
      removeItem.mutate({ productId, variantId });
    } else {
      updateQuantity.mutate({ productId, variantId, quantity: currentQuantity - 1 });
    }
  };

  if (stock <= 0) {
    return (
      <button disabled className="w-full bg-gray-200 text-gray-500 py-3 rounded-xl font-bold text-sm tracking-wide cursor-not-allowed">
        OUT OF STOCK
      </button>
    );
  }

  // Display quantity controls if item is in cart
  if (currentQuantity > 0) {
    return (
      <div className="flex items-center justify-between bg-gray-100 border border-gray-200 rounded-xl p-1 w-full h-[48px]">
        <button 
          onClick={handleDecrease}
          disabled={isUpdating}
          className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm hover:text-[#006044] disabled:opacity-50 transition-colors"
        >
          <Minus size={18} />
        </button>
        <span className="font-black text-gray-900 w-8 text-center text-lg">
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mx-auto text-[#006044]" /> : currentQuantity}
        </span>
        <button 
          onClick={handleIncrease}
          disabled={isUpdating || currentQuantity >= stock}
          className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm hover:text-[#006044] disabled:opacity-50 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>
    );
  }

  // Default "Add to Cart" state
  return (
    <button 
      onClick={handleAddInitial}
      disabled={isAdding}
      className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-[#006044] text-white h-[48px] rounded-xl font-bold text-sm tracking-wide transition-colors disabled:opacity-70 disabled:cursor-not-allowed group-hover:shadow-md"
    >
      {isAdding ? (
        <span className="flex items-center gap-2 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" /> ADDING...
        </span>
      ) : (
        <>
          <ShoppingCart className="w-4 h-4" />
          ADD TO CART
        </>
      )}
    </button>
  );
};