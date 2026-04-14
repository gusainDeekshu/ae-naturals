// src\services\cart.service.ts

import { apiClient } from "@/lib/api-client";
import { AddToCartPayload } from "@/types/cart";

export const CartService = {
  getCart: async () => {
    const { data } = await apiClient.get("/cart");
    return data;
  },

  // Fixed: POST /cart (Removed /items to match REST standard)
  addToCart: async (payload: AddToCartPayload) => {
    // ❌ OLD: await apiClient.post('/cart/add', payload);
    // ✅ NEW: Use the correct REST endpoint
    const { data } = await apiClient.post("/cart", payload);
    return data;
  },

  // Fixed: PATCH /cart/:productId
  updateQuantity: async ({
    productId,
    quantity,
    variantId,
  }: {
    productId: string;
    quantity: number;
    variantId?: string;
  }) => {
    const { data } = await apiClient.patch(`/cart/${productId}`, {
      quantity,
      variantId,
    });
    return data;
  },

  // Fixed: DELETE /cart/:productId
  removeItem: async ({
    productId,
    variantId,
  }: {
    productId: string;
    variantId?: string;
  }) => {
    const { data } = await apiClient.delete(`/cart/${productId}`, {
      data: { variantId },
    });
    return data;
  },

  clearCart: async () => {
    const { data } = await apiClient.delete("/cart");
    return data;
  },

  mergeCart: async () => {
    const { data } = await apiClient.post("/cart/merge");
    return data;
  },
};
