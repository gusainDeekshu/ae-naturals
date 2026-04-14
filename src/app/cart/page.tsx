"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, Plus, Minus, ShoppingBag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Store & Hooks
import { useAuthStore } from "@/store/useAuthStore"; // Ensure this path matches your setup
import { useCart } from "@/hooks/useCart";

// Services & Components
import { addressService, Address } from "@/services/address.service";
import { OtpModal } from "@/components/auth/OtpModal";
import { AddressDrawer } from "@/components/checkout/AddressDrawer";

export default function CartPage() {
  const router = useRouter();
  
  // 1. Replaced useCartStore with the new API-connected useCart hook
  const { cart, isLoading, updateQuantity, removeItem } = useCart();
  const { user } = useAuthStore();
  
  // States
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoginOpen, setLoginOpen] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  // Safe extraction of items from the backend response
  const cartItems = cart?.items || [];

  // Calculate totals based on the database priceSnapshot
  const subtotal = cartItems.reduce(
    (acc: number, item: any) => acc + (item.priceSnapshot * item.quantity), 
    0
  );
  const estimatedDelivery = subtotal > 999 || subtotal === 0 ? 0 : 99; 
  const total = subtotal + estimatedDelivery;

  // Intercepting the "Place Order" click
  const initiateCheckoutProcess = async () => {
    // 1. Check Auth
    if (!user) {
      setLoginOpen(true);
      return;
    }

    if (cartItems.length === 0) return;
    
    try {
      setIsProcessing(true);
      
      // 2. Check if user already has an address
      const addresses = await addressService.getUserAddresses();
      
      if (addresses.length === 0) {
        // 3. If no address, open the right-side sliding drawer
        setDrawerOpen(true);
      } else {
        // 4. If address exists, proceed directly to the checkout summary page
        router.push('/checkout');
      }
      
    } catch (error) {
      console.error("Failed to check addresses:", error);
      // Fallback: route to checkout where they can add it via the form
      router.push('/checkout'); 
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddressSavedFromDrawer = (newAddress: Address) => {
    // Once the user successfully saves an address in the drawer,
    // close it and push them to the final checkout page.
    setDrawerOpen(false);
    router.push('/checkout');
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#006044] mb-4" size={40} />
        <p className="text-gray-500 font-bold tracking-widest uppercase text-sm">Syncing Cart...</p>
      </div>
    );
  }

  // Empty Cart State
  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[60vh]">
        <ShoppingBag size={80} className="text-gray-200 mb-6" />
        <h2 className="text-2xl font-bold text-gray-800">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Add some beautiful products to get started!</p>
        <Link href="/">
          <Button className="bg-[#006044] hover:bg-[#004d3d] px-8 py-6 text-lg rounded-xl">
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
        
        {/* LEFT COLUMN: Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <h1 className="text-2xl font-black text-gray-800 mb-6">
            Shopping Cart ({cartItems.length})
          </h1>

          {cartItems.map((item: any) => (
            <div key={item.id} className="flex gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              {/* Product Image (Mapped safely from backend) */}
              <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-gray-50 border border-gray-100">
                <img 
                  src={item.product?.images?.[0] || '/placeholder.png'} 
                  alt={item.product?.name || 'Product'} 
                  className="w-full h-full object-cover" 
                />
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between">
                  <h3 className="font-bold text-gray-800 line-clamp-2 pr-4">
                    {item.product?.name || 'Unknown Product'}
                  </h3>
                  <button 
                    onClick={() => removeItem.mutate({ productId: item.productId, variantId: item.variantId })} 
                    disabled={removeItem.isPending}
                    className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    {removeItem.isPending ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                  </button>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <span className="font-black text-[#006044] text-lg">
                    ₹{item.priceSnapshot}
                  </span>
                  
                  {/* Quantity Controls connected to Mutations */}
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1">
                    <button 
                      onClick={() => updateQuantity.mutate({ 
                        productId: item.productId, 
                        variantId: item.variantId,
                        quantity: Math.max(1, item.quantity - 1) 
                      })}
                      disabled={updateQuantity.isPending}
                      className="hover:text-[#006044] disabled:opacity-50 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold w-6 text-center">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => updateQuantity.mutate({ 
                        productId: item.productId, 
                        variantId: item.variantId,
                        quantity: item.quantity + 1 
                      })}
                      disabled={updateQuantity.isPending}
                      className="hover:text-[#006044] disabled:opacity-50 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT COLUMN: Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-md sticky top-28">
            <h2 className="text-lg font-bold mb-4">Order Summary</h2>
            
            <div className="space-y-3 text-sm border-b pb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Est. Delivery Charges</span>
                <span className="font-semibold">{estimatedDelivery === 0 ? "FREE" : `₹${estimatedDelivery}`}</span>
              </div>
            </div>
            
            <div className="flex justify-between font-black text-xl py-6">
              <span>Total Amount</span>
              <span className="text-[#006044]">₹{total.toLocaleString('en-IN')}</span>
            </div>

            <Button
              onClick={initiateCheckoutProcess}
              disabled={isProcessing || updateQuantity.isPending || removeItem.isPending}
              className="w-full bg-[#006044] hover:bg-[#004d3d] h-14 text-lg font-bold rounded-xl transition-all shadow-lg shadow-green-900/20 disabled:opacity-70"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2"><Loader2 className="animate-spin" size={20} /> Processing...</div>
              ) : (
                user ? "Place Order" : "Login to Checkout"
              )}
            </Button>

            <p className="text-[10px] text-gray-400 text-center mt-5 uppercase tracking-wider font-semibold leading-relaxed">
              Safe and Secure Payments. <br/> Easy returns. 100% Authentic.
            </p>
          </div>
        </div>

        {/* Modals & Drawers */}
        <OtpModal
          isOpen={isLoginOpen}
          onClose={() => setLoginOpen(false)}
          onSuccess={() => {
            setLoginOpen(false);
            initiateCheckoutProcess(); // Re-trigger flow after successful login
          }}
        />

        <AddressDrawer 
          isOpen={isDrawerOpen} 
          onClose={() => setDrawerOpen(false)} 
          onAddressSelect={handleAddressSavedFromDrawer} 
        />
      </div>
    </div>
  );
}