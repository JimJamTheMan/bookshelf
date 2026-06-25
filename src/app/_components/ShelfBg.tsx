"use client";

import { useState } from "react";

// Bookshelf hero background. Uses /shelf-bg.jpg when present, and gracefully
// falls back to a warm wood gradient + orange glow if the image is missing.
export function ShelfBg() {
  const [ok, setOk] = useState(true);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[700px] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#2a1a10] via-[#1c1209] to-[#15130f]" />

      {ok && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/shelf-bg.jpg"
          alt=""
          onError={() => setOk(false)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-[#15130f]/75 via-[#15130f]/30 to-[#15130f]" />
      <div
        className="absolute left-1/2 top-6 h-[440px] w-[860px] max-w-[95vw] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(247,162,59,0.50), rgba(247,140,40,0.14) 45%, transparent 70%)",
          filter: "blur(55px)",
        }}
      />
    </div>
  );
}
