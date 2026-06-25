"use client";

import { useState } from "react";
import { hiResCover } from "@/lib/format";

// Shows a cover image, falling back to a tasteful colour-tinted tile with the
// title if the image is missing or fails to load (e.g. albums with no cover art).
export function Cover({
  src,
  title,
  color,
}: {
  src: string | null;
  title: string;
  color: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-white/80"
        style={{ background: `linear-gradient(160deg, ${color}33, #200f0a)` }}
      >
        {title}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={hiResCover(src) ?? src}
      alt={`Cover of ${title}`}
      className="h-full w-full object-cover"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
