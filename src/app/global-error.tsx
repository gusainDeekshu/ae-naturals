"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-center px-4">
          <h2 className="text-3xl font-black text-gray-900 mb-4">A critical error occurred</h2>
          <p className="text-gray-600 mb-8 max-w-md">
            Our engineering team has been notified. Please try reloading the page.
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-[#217A6E] text-white font-bold rounded-xl shadow-md hover:bg-[#185e54] transition-colors"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}