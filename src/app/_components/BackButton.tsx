"use client";

import { useRouter } from "next/navigation";

// Goes to the actual previous page (browser history). If the user landed here
// directly (no history — e.g. a shared link), it falls back to a sensible page.
export function BackButton({
  fallback = "/",
  label = "← Back",
  className = "text-sm text-white/50 hover:text-white/80",
}: {
  fallback?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push(fallback);
        }
      }}
      className={className}
    >
      {label}
    </button>
  );
}
