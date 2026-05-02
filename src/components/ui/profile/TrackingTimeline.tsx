"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { CheckCircle2, Truck, Package, Clock, AlertCircle } from "lucide-react";

// 1. Define the expected structure of the API response
interface TrackingData {
  orderStatus: string;
  message?: string;
  shipmentDetails: {
    courier: string;
    awbCode: string;
    trackingUrl: string | null;
    status: string;
  } | null;
  liveTracking: any | null;
}

export default function TrackingTimeline({ orderId }: { orderId: string }) {
  // 2. Pass the type to useQuery so TypeScript knows what 'data' looks like
  const { data, isLoading, error } = useQuery<TrackingData>({
    queryKey: ["order-tracking", orderId],
    queryFn: async () => {
      const res = await apiClient.get(`/orders/${orderId}/tracking`);
      return res.data;
    },
    // 3. In React Query v5, refetchInterval receives the entire Query object
    refetchInterval: (query) => {
      const currentData = query.state.data;
      if (currentData?.orderStatus === 'SHIPPED' || currentData?.orderStatus === 'PROCESSING') {
        return 30000; // Poll every 30 seconds
      }
      return false; // Stop polling
    },
  });

  if (isLoading) {
    return <div className="animate-pulse flex space-x-4 p-4">Loading live tracking...</div>;
  }

  if (error || !data) {
    return (
      <div className="text-red-500 flex items-center gap-2 p-4">
        <AlertCircle className="h-5 w-5" /> Failed to load tracking data.
      </div>
    );
  }

  const { orderStatus, shipmentDetails, liveTracking } = data;

  return (
    <div className="bg-white rounded-lg border p-6 mt-4 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Shipment Tracking</h3>
      
      {/* Shipment Meta */}
      {shipmentDetails ? (
        <div className="flex flex-wrap gap-4 text-sm bg-gray-50 p-3 rounded-md mb-6 border">
          <p><strong>Courier:</strong> {shipmentDetails.courier}</p>
          <p><strong>AWB Code:</strong> <span className="font-mono text-blue-600">{shipmentDetails.awbCode}</span></p>
          {shipmentDetails.trackingUrl && (
            <a 
              href={shipmentDetails.trackingUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="text-blue-600 hover:underline"
            >
              Track on Courier Website
            </a>
          )}
        </div>
      ) : (
        <div className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-md mb-6">
          {data.message || "We are preparing your shipment. Check back soon!"}
        </div>
      )}

      {/* Live Timeline */}
      <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
        
        {/* Step 1: Order Placed */}
        <div className="relative pl-6">
          <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-green-500 ring-4 ring-white" />
          <p className="font-semibold text-gray-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" /> Order Confirmed
          </p>
          <p className="text-xs text-gray-500">Your payment was successful.</p>
        </div>

        {/* Step 2: Processing */}
        {orderStatus === 'PROCESSING' || orderStatus === 'SHIPPED' || orderStatus === 'DELIVERED' ? (
          <div className="relative pl-6">
            <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-blue-500 ring-4 ring-white" />
            <p className="font-semibold text-gray-800 flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" /> Packed & Ready
            </p>
            <p className="text-xs text-gray-500">Your order has been packed and AWB generated.</p>
          </div>
        ) : null}

        {/* Step 3: Shiprocket Live API Events */}
        {liveTracking && liveTracking.tracking_data?.track_status === 1 ? (
           liveTracking.tracking_data.shipment_track_activities.map((activity: any, index: number) => (
             <div key={index} className="relative pl-6">
               <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-purple-500 ring-4 ring-white" />
               <p className="font-semibold text-gray-800">{activity.activity}</p>
               <p className="text-xs text-gray-500 flex items-center gap-1">
                 <Clock className="h-3 w-3" /> {activity.date} - {activity.location}
               </p>
             </div>
           ))
        ) : orderStatus === 'SHIPPED' && !liveTracking ? (
          <div className="relative pl-6">
            <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-gray-300 ring-4 ring-white" />
            <p className="font-semibold text-gray-800 flex items-center gap-2">
              <Truck className="h-4 w-4 text-gray-500" /> Shipped
            </p>
            <p className="text-xs text-gray-500">Waiting for live updates from {shipmentDetails?.courier || 'the courier'}.</p>
          </div>
        ) : null}

      </div>
    </div>
  );
}