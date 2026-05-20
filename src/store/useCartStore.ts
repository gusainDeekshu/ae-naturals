import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartService } from "@/services/cart.service";
import { useAuthStore } from "./useAuthStore";
import { toast } from "sonner";
import { BRAND } from "@/config/brand.config";

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  storeId?: string;
   isCodEnabled?: boolean;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  syncCart: () => Promise<void>;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (productId: string, variantId?: string) => Promise<void>;
  updateQuantity: (
    productId: string,
    quantity: number,
    variantId?: string,
  ) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      syncCart: async () => {
        const { items, fetchCart } = get();
        const currentUser = useAuthStore.getState().user;

        if (!currentUser) return;

        if (items.length > 0) {
          try {
            const payload = items.map((i: CartItem) => ({
              productId: i.productId,
              variantId: i.variantId,
              quantity: i.quantity,
            }));

            const res: any = await CartService.mergeCart({ items: payload });

            if (res && res.success === false) {
              console.warn("Cart merge rejected:", res.message);
              return;
            }
          } catch (err: any) {
            // 🔥 Proper Error Extraction
            const msg = err.response?.data?.message || "Failed to sync cart.";
            console.error("Cart Sync failed:", msg);
            return; 
          }
        }
        await fetchCart();
      },

      fetchCart: async () => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;

        set({ isLoading: true });
        try {
          const res: any = await CartService.getCart();
          if (res && res.items) {
            const normalized = res.items.map((item: any) => ({
              productId: item.productId,
              variantId: item.variantId || undefined, 
              name: item.variant?.name ? `${item.product.name} - ${item.variant.name}` : item.product.name,
              price: item.priceSnapshot, 
              image: item.product.images?.[0] || "",
              quantity: item.quantity,
              storeId: item.tenantId, 
              isCodEnabled: item.product.isCodEnabled, 
            }));
            set({ items: normalized });
          } else if (res && Array.isArray(res.items) && res.items.length === 0) {
            set({ items: [] });
          }
        } catch (error: any) {
          console.error("fetchCart failed", error.response?.data?.message || error.message);
        } finally {
          set({ isLoading: false });
        }
      },

      addItem: async (newItem: CartItem) => {
        const currentUser = useAuthStore.getState().user;

        if (currentUser) {
          try {
            await CartService.addToCart({
              productId: newItem.productId,
              variantId: newItem.variantId,
              quantity: newItem.quantity,
            });
            await get().fetchCart();
          } catch (err: any) {
            // 🔥 EXTRACT THE "Insufficient stock" MESSAGE HERE
            const errorMessage = err.response?.data?.message || "Failed to add item.";
            toast.error(`❌ ${errorMessage}`); // Replace with a toast library if you have one
            console.error("Failed to add item to remote cart", errorMessage);
          }
        } else {
          // Guest: Manage state locally (Stock is checked on backend later during sync/checkout)
          const currentItems = get().items;

          
          const existing = currentItems.find(
            (i: CartItem) => i.productId === newItem.productId && i.variantId === newItem.variantId
          );

// 🔥 FIX: Force price to be a valid number to prevent payload poisoning
          const safeItem = { ...newItem, price: newItem.price || 0 };

          if (existing) {
            set({
              items: currentItems.map((i: CartItem) =>
                i.productId === safeItem.productId && i.variantId === safeItem.variantId
                  ? { ...i, quantity: i.quantity + safeItem.quantity, price: safeItem.price }
                  : i
              ),
            });
          } else {
            set({ items: [...currentItems, safeItem] });
          }
        }
      },

      removeItem: async (productId: string, variantId?: string) => {
        const { user } = useAuthStore.getState();
        if (user) {
          try {
            await CartService.removeItem({ productId, variantId });
            await get().fetchCart();
          } catch (err: any) {
            console.error("Remove failed", err.response?.data?.message || err.message);
          }
        } else {
          set({
            items: get().items.filter(
              (i: CartItem) => !(i.productId === productId && i.variantId === variantId)
            ),
          });
        }
      },

      updateQuantity: async (productId: string, quantity: number, variantId?: string) => {
        const { user } = useAuthStore.getState();
        if (user) {
          try {
            await CartService.updateQuantity({ productId, variantId, quantity });
            await get().fetchCart();
          } catch (err: any) {
            // 🔥 EXTRACT STOCK ERROR DURING QUANTITY UPDATE
            const errorMessage = err.response?.data?.message || "Update failed.";
            toast.error(`❌ ${errorMessage}`);
            console.error("Update failed", errorMessage);
          }
        } else {
          set({
            items: get().items.map((i: CartItem) =>
              i.productId === productId && i.variantId === variantId
                ? { ...i, quantity }
                : i
            ),
          });
        }
      },

      clearCart: async () => {
        const { user } = useAuthStore.getState();
        if (user) await CartService.clearCart();
        set({ items: [] });
      },
    }),
    {
      name: `${BRAND.useStoreName}-cart`,
      partialize: (state: CartState) => ({ items: state.items }),
    }
  )
);
