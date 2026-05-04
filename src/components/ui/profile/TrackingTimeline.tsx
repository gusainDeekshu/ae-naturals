import React from 'react';
import { CheckCircle2, Truck, Package, Home, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

const TRACKING_STEPS = [
  { status: 'PENDING', label: 'Order Placed', icon: Clock },
  { status: 'READY_TO_SHIP', label: 'Packed & Ready', icon: Package },
  { status: 'IN_TRANSIT', label: 'In Transit', icon: Truck },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
  { status: 'DELIVERED', label: 'Delivered', icon: Home },
];

export const TrackingTimeline = ({ shipment, events }: { shipment: any, events: any[] }) => {
  const currentStatus = shipment?.status || 'PENDING';
  const isCancelled = currentStatus === 'CANCELLED' || currentStatus === 'FAILED';

  // Find the index of the current active step
  const activeIndex = TRACKING_STEPS.findIndex(step => step.status === currentStatus);

  return (
    <div className="w-full max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-sm text-gray-500">Tracking Number</p>
          <p className="font-semibold text-gray-900">{shipment?.awb || 'Awaiting Generation'}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Courier</p>
          <p className="font-semibold text-gray-900">{shipment?.courier || 'Pending'}</p>
        </div>
      </div>

      <div className="relative border-l-2 border-gray-200 ml-4 mt-8">
        {TRACKING_STEPS.map((step, index) => {
          const isCompleted = isCancelled ? false : index <= activeIndex;
          const isCurrent = isCancelled ? false : index === activeIndex;
          const Icon = step.icon;

          // Find the most recent event matching this status
          const stepEvent = events.find(e => e.status === step.status);

          return (
            <div key={step.status} className="mb-8 ml-8 relative">
              <span className={`absolute -left-[41px] flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white
                ${isCompleted ? 'border-green-500 text-green-500' : 'border-gray-300 text-gray-400'}
                ${isCurrent ? 'ring-4 ring-green-50' : ''}
              `}>
                <Icon size={16} />
              </span>
              
              <h3 className={`font-semibold text-base ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                {step.label}
              </h3>
              
              {stepEvent && (
                <div className="mt-1">
                  <p className="text-sm text-gray-600">{stepEvent.message}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span>{format(new Date(stepEvent.eventTimestamp), 'MMM dd, yyyy - hh:mm a')}</span>
                    {stepEvent.location && (
                      <>
                        <span>•</span>
                        <span>{stepEvent.location}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Failure / Cancellation State */}
        {isCancelled && (
          <div className="mb-8 ml-8 relative">
            <span className="absolute -left-[41px] flex items-center justify-center w-8 h-8 rounded-full border-2 border-red-500 bg-white text-red-500 ring-4 ring-red-50">
              <XCircle size={16} />
            </span>
            <h3 className="font-semibold text-base text-red-600">Shipment {currentStatus}</h3>
            <p className="text-sm text-gray-600 mt-1">Please contact support for more information.</p>
          </div>
        )}
      </div>
      
      {shipment?.trackingUrl && (
        <a 
          href={shipment.trackingUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-6 block w-full text-center bg-gray-50 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-100 transition"
        >
          View on Courier Website
        </a>
      )}
    </div>
  );
};