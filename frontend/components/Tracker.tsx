"use client";

import Script from "next/script";

declare global {
  interface Window {
    CausalFunnel?: {
      init: (config: { endpoint: string }) => void;
    };
  }
}

export default function Tracker() {
  return (
    <Script
      src={`${process.env.NEXT_PUBLIC_API_URL}/tracker.js`}
      strategy="afterInteractive"
      onLoad={() => {
        if (typeof window !== "undefined" && window.CausalFunnel) {
          window.CausalFunnel.init({
            endpoint: `${process.env.NEXT_PUBLIC_API_URL}/api/events`,
          });
        }
      }}
    />
  );
}
