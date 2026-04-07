"use client";

import { useCartStore } from "@/store/useCartStore";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { orderService } from "@/services/order.service";
import { paymentService } from "@/services/payment.service";
import { addressService, Address } from "@/services/address.service";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2, TruckIcon, Truck } from "lucide-react";
import { PaymentInitiateResponse } from "@/types/payment";
import { executePaymentFlow } from "@/lib/payment-handler";

interface CourierOption {
  courier_id: string;
  courier_name: string;
  rate: number;
  etd: string;
}

export default function CheckoutPage() {
  const { items } = useCartStore();
  const router = useRouter();

  // --- State Management ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);

  // --- Shipping State (Updated for Courier Selection) ---
  const [courierOptions, setCourierOptions] = useState<CourierOption[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState<string | null>(null);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);

  // --- Form State ---
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
    isDefault: false,
  });

  // Ref for debouncing shipping API calls
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const cartTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  // Calculate weight for Shiprocket (fallback to 0.5kg per item if missing)
  const totalWeight = items.reduce((acc, item) => acc + ((item as any).shippingWeightKg || 0.5) * item.quantity, 0);
  const grandTotal = cartTotal + shippingCost;
  const storeId = items[0]?.storeId || "default-store";

  // --- Load Addresses ---
  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const data = await addressService.getUserAddresses();
      setAddresses(data);

      if (data.length > 0) {
        const defaultAddr = data.find((a) => a.isDefault) || data[0];
        setSelectedAddress(defaultAddr);
      } else {
        setShowAddAddressForm(true);
      }
    } catch (error) {
      console.error("Failed to fetch addresses", error);
      toast.error("Failed to load addresses");
    }
  };

  // --- Shipping Calculation (Debounced) ---
  useEffect(() => {
    if (selectedAddress && items.length > 0) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      debounceTimer.current = setTimeout(() => {
        fetchShippingEstimates(selectedAddress.pincode);
      }, 500);
    }

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [selectedAddress, items]);

  const fetchShippingEstimates = async (deliveryPincode: string) => {
    setIsCalculatingShipping(true);
    setShippingError(null);
    setCourierOptions([]);
    setShippingCost(0);
    setSelectedCourierId(null);

    try {
      // Call the new estimation endpoint
      const { data } = await apiClient.post('/shipping/estimate', {
        pickup_pincode: "560001", // Replace with your actual warehouse pincode
        delivery_pincode: deliveryPincode,
        weight: totalWeight,
        cod: 0
      });

      if (data.options && data.options.length > 0) {
        // Sort options by cheapest rate
        const sortedOptions = [...data.options].sort((a, b) => a.rate - b.rate);
        setCourierOptions(sortedOptions);
        
        // Auto-select the cheapest option
        handleCourierSelect(sortedOptions[0]);
        toast.success("Delivery options updated");
      } else {
        setShippingError("Delivery is not available for this pincode.");
      }
    } catch (error: any) {
      console.error("Shipping error", error);
      const msg = error.response?.data?.message || `Failed to fetch delivery options for ${deliveryPincode}`;
      setShippingError(msg);
      toast.error(msg);
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  const handleCourierSelect = (option: CourierOption) => {
    setSelectedCourierId(option.courier_id);
    setShippingCost(option.rate);
  };

  // --- Add Address ---
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const added = await addressService.addAddress({
        ...newAddress,
        label: newAddress.label.toUpperCase() as "HOME" | "WORK" | "OTHER",
      });

      setAddresses([...addresses, added]);
      setSelectedAddress(added);
      setShowAddAddressForm(false);

      toast.success("Address added successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to add address");
    }
  };

  // --- Place Order & Trigger Payment ---
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    if (!selectedCourierId) {
      toast.error("Please select a delivery method");
      return;
    }

    if (isCalculatingShipping) {
      toast.error("Please wait while shipping is calculated");
      return;
    }

    if (shippingError) {
      toast.error("Please resolve shipping errors before proceeding");
      return;
    }

    const currentItems = useCartStore.getState().items;

    if (!currentItems || currentItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    const currentStoreId = currentItems[0]?.storeId;

    if (!currentStoreId) {
      toast.error("Store info missing");
      return;
    }

    setIsProcessing(true);

    try {
      toast.loading("Placing your order...");

      // 1. Create the order in the database (passing courierId)
      const order = await orderService.createOrder(
        currentStoreId,
        selectedAddress.id,
        shippingCost.toString(),
        selectedCourierId // 🔥 Injecting selected courier
      );

      useCartStore.getState().clearCart();
      toast.success("Order created! Initializing payment...");

      // 2. Fetch the payment initiation data from the backend
      const payRes = await paymentService.initiatePayment(order.id);
      const responseData: PaymentInitiateResponse = payRes?.data || payRes;

      console.log("BACKEND PAYLOAD:", responseData);

      // 3. Delegate routing
      executePaymentFlow(responseData, order.id, router);

    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.message || "Checkout failed";
      toast.error(msg);
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 font-medium mt-10">
        Your cart is empty. Please add items to proceed.
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* LEFT: Address Selection */}
      <div>
        <h2 className="text-xl font-bold mb-4">Delivery Address</h2>

        {addresses.length > 0 && !showAddAddressForm ? (
          <div className="space-y-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                onClick={() => setSelectedAddress(addr)}
                className={`p-4 border rounded-xl cursor-pointer transition-colors ${
                  selectedAddress?.id === addr.id
                    ? "border-[#006044] bg-[#006044]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-semibold">{addr.name}</div>
                <div className="text-sm text-gray-600">
                  {addr.addressLine}, {addr.city}
                </div>
                <div className="text-sm text-gray-600">
                  {addr.state} - {addr.pincode}
                </div>
              </div>
            ))}

            <Button variant="outline" className="w-full mt-4 border-dashed" onClick={() => setShowAddAddressForm(true)}>
              + Add New Address
            </Button>
          </div>
        ) : (
          <form onSubmit={handleAddAddress} className="space-y-3 bg-white p-6 rounded-xl border border-gray-100">
             <div className="grid grid-cols-2 gap-3">
              <input className="p-2 border rounded-md w-full" placeholder="First Name" required onChange={(e) => setNewAddress({ ...newAddress, firstName: e.target.value })} />
              <input className="p-2 border rounded-md w-full" placeholder="Last Name" required onChange={(e) => setNewAddress({ ...newAddress, lastName: e.target.value })} />
            </div>
            <input className="p-2 border rounded-md w-full" placeholder="Email" type="email" required onChange={(e) => setNewAddress({ ...newAddress, email: e.target.value })} />
            <input className="p-2 border rounded-md w-full" placeholder="Phone" type="tel" required onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} />
            <input className="p-2 border rounded-md w-full" placeholder="Address Line" required onChange={(e) => setNewAddress({ ...newAddress, addressLine: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input className="p-2 border rounded-md w-full" placeholder="City" required onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
              <input className="p-2 border rounded-md w-full" placeholder="State" required onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} />
            </div>
            <input className="p-2 border rounded-md w-full" placeholder="Pincode" required onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} />

            <div className="flex gap-3 pt-2">
               <Button type="button" variant="outline" className="w-full" onClick={() => setShowAddAddressForm(false)}>Cancel</Button>
               <Button type="submit" className="w-full bg-[#006044] hover:bg-[#004d36] text-white">Save Address</Button>
            </div>
          </form>
        )}
      </div>

      {/* RIGHT: Order Summary & Delivery Options */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 h-fit sticky top-24 shadow-sm">
        <h2 className="text-xl font-bold mb-4 border-b pb-4">Order Summary</h2>

        <div className="space-y-3 max-h-40 overflow-y-auto pr-2 mb-6">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between text-sm">
              <span className="text-gray-700 truncate pr-4">{item.name} <span className="text-gray-400">x{item.quantity}</span></span>
              <span className="font-medium whitespace-nowrap">₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* 🔥 NEW: Courier Selection UI */}
        <div className="border-t pt-4 mb-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Truck size={18} className="text-[#006044]" /> Delivery Options
          </h3>
          
          {isCalculatingShipping ? (
            <div className="flex items-center gap-2 text-sm text-[#006044] bg-[#006044]/5 p-3 rounded-lg border border-[#006044]/10">
              <Loader2 className="animate-spin w-4 h-4" /> Fetching best rates...
            </div>
          ) : courierOptions.length > 0 ? (
            <div className="space-y-2">
              {courierOptions.map((option) => (
                <label 
                  key={option.courier_id}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedCourierId === option.courier_id ? 'border-[#006044] bg-[#006044]/5' : 'hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="courier" 
                      checked={selectedCourierId === option.courier_id}
                      onChange={() => handleCourierSelect(option)}
                      className="text-[#006044] focus:ring-[#006044] w-4 h-4 accent-[#006044]"
                    />
                    <div>
                      <p className="font-medium text-sm text-gray-900">{option.courier_name}</p>
                      <p className="text-xs text-gray-500">Est. Delivery: {option.etd}</p>
                    </div>
                  </div>
                  <span className="font-bold text-gray-900">
                    {option.rate === 0 ? 'FREE' : `₹${option.rate}`}
                  </span>
                </label>
              ))}
            </div>
          ) : shippingError ? (
             <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
               {shippingError}
             </div>
          ) : (
            <p className="text-sm text-gray-500 italic p-3 border rounded-lg bg-gray-50">
              Select a delivery address to view courier options.
            </p>
          )}
        </div>

        {/* Totals */}
        <div className="space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>₹{cartTotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center text-gray-600">
            <span>Shipping</span>
            <span className={shippingCost === 0 && selectedCourierId ? "text-green-600 font-medium" : ""}>
               {shippingCost === 0 ? (selectedCourierId ? "FREE" : "₹0.00") : `₹${shippingCost.toFixed(2)}`}
            </span>
          </div>

          <div className="font-bold text-lg flex justify-between mt-4 border-t pt-4">
            <span>Total</span>
            <span className="text-[#006044]">₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <Button
          onClick={handlePlaceOrder}
          disabled={isProcessing || !!shippingError || isCalculatingShipping || addresses.length === 0 || !selectedCourierId}
          className="w-full mt-6 bg-[#006044] hover:bg-[#004d36] text-white py-6 text-lg rounded-xl shadow-md transition-all active:scale-[0.98]"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Processing...
            </span>
          ) : (
            `Proceed to Pay ₹${grandTotal.toFixed(2)}`
          )}
        </Button>
      </div>
    </div>
  );
}