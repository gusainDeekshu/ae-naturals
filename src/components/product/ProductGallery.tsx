"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  // Safe initialization fallback string guard
  const [activeImg, setActiveImg] = useState(images?.[0] || "/placeholder.png");
  
  // Zoom States
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [showZoom, setShowZoom] = useState(false);

  // Synchronize state if product images arrive late from an async API call
  useEffect(() => {
    if (images?.length > 0 && (!activeImg || activeImg === "/placeholder.png")) {
      setActiveImg(images[0]);
    }
  }, [images, activeImg]);

  /**
   * Calculates the mouse position as a percentage of the container dimensions.
   * This drives the backgroundPosition of the zoomed image.
   */
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPosition({ x, y });
  };

  return (
    <div className="lg:sticky lg:top-24">
      <div className="flex flex-col md:flex-row gap-4">
        
        {/* Thumbnails */}
        <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:max-h-[500px] no-scrollbar shrink-0">
          {images?.map((img, idx) => (
            <button
              key={idx}
              onMouseEnter={() => setActiveImg(img)}
              onClick={() => setActiveImg(img)}
              className={`relative w-16 h-16 rounded-md border overflow-hidden shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                activeImg === img
                  ? "border-orange-500 ring-1 ring-orange-500"
                  : "border-gray-200 hover:border-orange-300"
              }`}
            >
              <Image
                src={img}
                alt={`${name} thumbnail ${idx + 1}`}
                fill
                sizes="64px" // 💡 FIX: Thumbnails are hardcoded to 16rem (64px)
                className="object-cover"
              />
            </button>
          ))}
        </div>

        {/* Main Image Container */}
        <div 
          className="relative w-full h-[400px] md:h-[500px] bg-white border border-gray-100 rounded-lg overflow-hidden md:cursor-crosshair group"
          onMouseEnter={() => setShowZoom(true)}
          onMouseLeave={() => setShowZoom(false)}
          onMouseMove={handleMouseMove}
        >
          {/* Base Image */}
          <Image
            src={activeImg}
            alt={name}
            fill
            priority // 💡 FIX: Tells Next.js to inject preload links to eliminate LCP delay warnings
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px" // 💡 FIX: Responsive size handling rules
            className="object-contain p-4"
          />

          {/* Zoom Overlay - Only visible on md+ screens during hover */}
          {showZoom && (
            <div
              className="absolute inset-0 z-10 hidden md:block bg-white bg-no-repeat pointer-events-none"
              style={{
                backgroundImage: `url(${activeImg})`,
                backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                backgroundSize: "250%", // Increase/Decrease this for more/less zoom
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}