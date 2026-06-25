"use client";

import { useState } from "react";

// Share the current page: uses the native share sheet when available
// (mobile / Edge), otherwise copies the link to the clipboard.
export function ShareButton({
  label = "Share",
  title,
}: {
  label?: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: title ?? document.title, url });
      } catch {
        /* user cancelled — do nothing */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  return (
    <button
      onClick={share}
      className="rounded border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/5"
    >
      {copied ? "Link copied!" : label}
    </button>
  );
}
