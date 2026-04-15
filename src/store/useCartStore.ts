import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartService } from "@/services/cart.service";
import { useAuthStore } from "./useAuthStore";

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  storeId?: string;
}

interface CartState {
  items: CartItem[]; 
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  syncCart: () => Promise<void>;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (productId: string, variantId?: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      fetchCart: async () => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return; 

        set({ isLoading: true });
        try {
          const res: any = await CartService.getCart();
          
          if (res && res.items) {
            const normalized = res.items.map((item: any) => ({
              productId: item.productId,
              variantId: item.variantId,
              name: item.variant?.name ? `${item.product.name} - ${item.variant.name}` : item.product.name,
              price: item.priceSnapshot, // Updated to use priceSnapshot from backend
              image: item.product.images?.[0] || "",
              quantity: item.quantity,
              storeId: item.tenantId, // backend uses tenantId instead of storeId
            }));
            
            set({ items: normalized });
          } else {
             set({ items: [] });
          }
        } catch (error) {
          console.error("fetchCart failed", error);
        } finally {
          set({ isLoading: false });
        }
      },

     syncCart: async () => {
        const { items, fetchCart } = get();
        const currentUser = useAuthStore.getState().user;
        
        if (!currentUser) return;
        
        // 1. If local cart has items, send them ALL in one network request
        if (items.length > 0) {
          try {
            const payload = items.map((i: CartItem) => ({
              productId: i.productId,
              variantId: i.variantId,
              quantity: i.quantity
            }));

            // 🔥 Make sure you add this method to your CartService!
            // e.g., await apiClient.post('/cart/merge', { items: payload })
            await CartService.mergeCart({ items: payload });

            // 🔥 CRITICAL: Wipe local ghost items immediately after successful merge
            // This guarantees idempotency (no duplicate merges on double clicks)
            set({ items: [] });
          } catch (err) {
            console.error("Cart Sync failed:", err);
            return; // Abort fetchCart if sync failed so we don't lose local items
          }
        }

        // 2. Fetch the final unified DB cart
        await fetchCart();
      },

      addItem: async (newItem: CartItem) => {
        const currentUser = useAuthStore.getState().user;
        
        if (currentUser) {
          try {
            await CartService.addToCart({
              productId: newItem.productId,
              variantId: newItem.variantId,
              quantity: newItem.quantity
            });
            await get().fetchCart();
          } catch (err) {
            console.error("Failed to add item to remote cart", err);
          }
        } else {
          // Guest: Manage state locally
          const currentItems = get().items;
          const existing = currentItems.find(
            (i: CartItem) => i.productId === newItem.productId && i.variantId === newItem.variantId
          );
          
          if (existing) {
            set({
              items: currentItems.map((i: CartItem) =>
                i.productId === newItem.productId && i.variantId === newItem.variantId
                  ? { ...i, quantity: i.quantity + newItem.quantity }
                  : i
              ),
            });
          } else {
            set({ items: [...currentItems, newItem] });
          }
        }
      },

      removeItem: async (productId: string, variantId?: string) => {
        const { user } = useAuthStore.getState();
        if (user) {
          try {
            await CartService.removeItem({ productId, variantId });
            await get().fetchCart();
          } catch (err) {
            console.error("Remove failed", err);
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
          } catch (err) {
            console.error("Update failed", err);
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
      name: "flower-fairy-cart",
      partialize: (state: CartState) => ({ items: state.items }),
    },
  ),
);