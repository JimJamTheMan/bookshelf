"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const TYPES = [
  { key: "books", label: "Books" },
  { key: "films", label: "Films" },
  { key: "tv", label: "TV" },
  { key: "games", label: "Games" },
  { key: "music", label: "Music" },
  { key: "art", label: "Art" },
];

// Prominent "search for new things to add" box with a media-type selector.
// Routes to the matching search page (e.g. /films?q=...).
export function FindNew() {
  const router = useRouter();
  const [type, setType] = useState("books");
  const [q, setQ] = useState("");

  function go(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(`/${type}${query ? `?q=${encodeURIComponent(query)}` : ""}`);
  }

  return (
    <form onSubmit={go} className="mx-auto mt-8 max-w-2xl">
      {/* Media-type chips */}
      <div className="flex flex-wrap justify-center gap-2">
        {TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setType(t.key)}
            className={
              type === t.key
                ? "rounded-full px-3 py-1 text-sm font-medium text-[#200f0a]"
                : "rounded-full border border-white/15 px-3 py-1 text-sm text-white/70 hover:bg-white/5"
            }
            style={type === t.key ? { background: "#d26a2a" } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search row */}
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/15 bg-black/40 px-4 py-3 backdrop-blur focus-within:border-[#d26a2a]/70">
        <span className="text-white/40">⌕</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Find ${
            TYPES.find((t) => t.key === type)?.label.toLowerCase() ?? "media"
          } to add…`}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
        />
        <button
          type="submit"
          className="rounded-lg px-4 py-1.5 text-sm font-semibold text-[#200f0a]"
          style={{ background: "#d26a2a" }}
        >
          Search
        </button>
      </div>
    </form>
  );
}
