"use client";

import { useCartStore } from "@/store/useCartStore";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { orderService } from "@/services/order.service";
import { paymentService } from "@/services/payment.service";
import { addressService, Address } from "@/services/address.service";
import { shippingService } from "@/services/shipping.service";

export default function CheckoutPage() {
  const { items } = useCartStore();
  const router = useRouter();

  // State Management
  const [isProcessing, setIsProcessing] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  
  // Shipping State
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);

  // Form State for new address
  const [newAddress, setNewAddress] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    label: "Home",
    isDefault: false
  });

  const cartTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const grandTotal = cartTotal + shippingCost;
  const storeId = items[0]?.storeId || "default-store";

  // 1. Fetch Addresses on Mount
  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const data = await addressService.getUserAddresses();
      setAddresses(data);
      if (data.length > 0) {
        // Auto-select the default or first address
        const defaultAddr = data.find(a => a.isDefault) || data[0];
        setSelectedAddress(defaultAddr);
      } else {
        setShowAddAddressForm(true);
      }
    } catch (error) {
      console.error("Failed to fetch addresses", error);
    }
  };

  // 2. Trigger Shipping Calculation when Address changes
  useEffect(() => {
    if (selectedAddress && items.length > 0) {
      calculateShipping(selectedAddress.state, selectedAddress.pincode);
    }
  }, [selectedAddress, items]);

  const calculateShipping = async (addressState: string, pincode: string) => {
    setIsCalculatingShipping(true);
    setShippingError(null); // Reset error on new calculation
    
    try {
      const payload = {
        storeId,
        address: { state: addressState, pincode: pincode },
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod: "PREPAID" as const,
        cartTotal
      };
      
      const res = await shippingService.calculateShipping(payload);
      setShippingCost(res.shippingCost);
    } catch (error: any) {
      console.error("Failed to calculate shipping", error);
      
      // Extract the error message from your backend response
      const errorMessage = error.response?.data?.message || `Delivery not available for pincode ${pincode}`;
      
      setShippingError(errorMessage);
      setShippingCost(0); // Reset cost so they don't see old amounts
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const added = await addressService.addAddress({
        ...newAddress,
        label: (newAddress.label.toUpperCase() as "HOME" | "WORK" | "OTHER")
      });
      setAddresses([...addresses, added]);
      setSelectedAddress(added);
      setShowAddAddressForm(false);
    } catch (error) {
      console.error("Failed to add address", error);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) return alert("Please select a delivery address.");
    
    // 🔥 The Fix: Get the FRESH items directly from the store state
    const currentItems = useCartStore.getState().items;

    console.log("Fresh Cart Items for Checkout:", currentItems);

    if (!currentItems || currentItems.length === 0) {
      console.error("Cart is empty. Cannot proceed to checkout.");
      return;
    }

    const currentStoreId = currentItems[0]?.storeId;

    if (!currentStoreId) {
      console.error("No store information found in cart items");
      return;
    }

    setIsProcessing(true);
    
    try {
      const order = await orderService.createOrder(
        currentStoreId,
        selectedAddress.id,
        shippingCost.toString()
      );

      // Clear local cart ONLY after backend order is confirmed
      useCartStore.getState().clearCart();

      const payRes = await paymentService.initiatePayment(order.id, "STRIPE");
      const checkoutUrl = payRes?.data?.url || payRes?.data?.checkoutUrl || payRes?.checkoutUrl;

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        router.push(`/order-success/${order.id}`);
      }
    } catch (err) {
      console.error("Checkout failed", err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return <div className="p-8 text-center text-gray-500 font-medium mt-10">Your cart is empty. Please add items to proceed.</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      
      {/* LEFT COLUMN: Delivery Information */}
      <div>
        <h2 className="text-xl font-bold mb-4">Delivery Address</h2>
        
        {addresses.length > 0 && !showAddAddressForm ? (
          <div className="space-y-4">
            {addresses.map((addr) => (
              <div 
                key={addr.id} 
                onClick={() => setSelectedAddress(addr)}
                className={`p-4 border rounded-xl cursor-pointer transition-colors ${
                  selectedAddress?.id === addr.id ? "border-[#006044] bg-[#006044]/5 shadow-sm" : "border-gray-200 hover:border-[#006044]/50"
                }`}
              >
                <div className="font-semibold text-gray-800">{addr.name}</div>
                <div className="text-sm text-gray-600 mt-1">{addr.addressLine}, {addr.city}</div>
                <div className="text-sm text-gray-600">{addr.state} - <span className="font-medium">{addr.pincode}</span></div>
                <div className="text-sm text-gray-600 font-medium mt-2">Phone: {addr.phone}</div>
              </div>
            ))}
            <Button variant="outline" onClick={() => setShowAddAddressForm(true)} className="w-full mt-2 font-bold text-gray-600 rounded-xl border-dashed border-2">
              + Add New Address
            </Button>
          </div>
        ) : (
          <form onSubmit={handleAddAddress} className="space-y-3 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="First Name" className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-[#006044] transition-colors" onChange={e => setNewAddress({...newAddress, firstName: e.target.value})} />
              <input required placeholder="Last Name" className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-[#006044] transition-colors" onChange={e => setNewAddress({...newAddress, lastName: e.target.value})} />
            </div>
            <input required type="email" placeholder="Email" className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-[#006044] transition-colors" onChange={e => setNewAddress({...newAddress, email: e.target.value})} />
            <input required placeholder="Phone Number" className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-[#006044] transition-colors" onChange={e => setNewAddress({...newAddress, phone: e.target.value})} />
            <input required placeholder="Address Line" className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-[#006044] transition-colors" onChange={e => setNewAddress({...newAddress, addressLine: e.target.value})} />
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="City" className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-[#006044] transition-colors" onChange={e => setNewAddress({...newAddress, city: e.target.value})} />
              <input required placeholder="State (e.g., Karnataka)" className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-[#006044] transition-colors" onChange={e => setNewAddress({...newAddress, state: e.target.value})} />
            </div>
            <input required placeholder="Pincode" className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-[#006044] transition-colors" onChange={e => setNewAddress({...newAddress, pincode: e.target.value})} />
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 bg-[#006044] hover:bg-[#004d3d] rounded-lg">Save Address</Button>
              {addresses.length > 0 && (
                <Button type="button" variant="outline" onClick={() => setShowAddAddressForm(false)} className="flex-1 rounded-lg">Cancel</Button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* RIGHT COLUMN: Order Summary */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-md h-fit sticky top-28">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Order Summary</h2>
        
        <div className="space-y-3 border-b border-gray-100 pb-4 mb-4 text-sm">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between items-center">
              <span className="text-gray-600 line-clamp-1 pr-4">{item.name} <span className="font-bold text-xs ml-1 text-gray-400">x{item.quantity}</span></span>
              <span className="font-bold text-gray-800">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2 mb-4 font-medium">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-gray-800">₹{cartTotal}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Shipping</span>
            <span>
              {isCalculatingShipping ? (
                <span className="text-xs text-[#006044] animate-pulse font-bold">Calculating...</span>
              ) : shippingError ? (
                <span className="text-red-500 font-bold text-xs uppercase tracking-wide">Unavailable</span>
              ) : shippingCost === 0 ? (
                <span className="text-[#006044] font-bold">FREE</span>
              ) : (
                <span className="text-gray-800">₹{shippingCost}</span>
              )}
            </span>
          </div>
        </div>

        {/* Display Shipping Error Box if Delivery is Unavailable */}
        {shippingError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-medium text-center">
            {shippingError}
          </div>
        )}

        <div className="flex justify-between text-xl font-black pt-4 border-t border-gray-100 text-[#006044]">
          <span>Total</span>
          <span>₹{grandTotal}</span>
        </div>

        <Button 
          onClick={handlePlaceOrder} 
          disabled={isProcessing || !selectedAddress || isCalculatingShipping || !!shippingError}
          className="w-full mt-6 py-6 text-lg font-bold bg-[#006044] hover:bg-[#004d3d] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? "Processing..." : `Pay ₹${grandTotal}`}
        </Button>
      </div>

    </div>
  );
}