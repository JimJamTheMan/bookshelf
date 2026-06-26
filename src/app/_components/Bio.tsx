"use client";

import { useState } from "react";

// A tidy, expandable biography: clamped to a few lines by default with a
// "Read more" toggle, so long bios stay neat but are never permanently cut off.
export function Bio({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 320;

  return (
    <div className="mt-5 max-w-prose">
      <p
        className={`whitespace-pre-wrap text-sm leading-relaxed text-[#e8c58f]/85 ${
          !expanded && long ? "line-clamp-4" : ""
        }`}
      >
        {text}
      </p>
      {long && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-1 text-xs font-medium text-[#d26a2a] hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
