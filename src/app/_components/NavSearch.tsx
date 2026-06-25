"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Discogs-style search: a category dropdown + box. "Everything" searches the
// whole catalogue (Discover); a specific type goes straight to that search page.
const OPTS = [
  { v: "all", label: "Everything", path: "/discover" },
  { v: "film", label: "Films", path: "/films" },
  { v: "tv", label: "TV", path: "/tv" },
  { v: "game", label: "Games", path: "/games" },
  { v: "music", label: "Music", path: "/music" },
  { v: "book", label: "Books", path: "/books" },
  { v: "art", label: "Art", path: "/art" },
];

export function NavSearch({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [type, setType] = useState("all");
  const [q, setQ] = useState("");

  function go(e: React.FormEvent) {
    e.preventDefault();
    const path = OPTS.find((o) => o.v === type)?.path ?? "/discover";
    const query = q.trim();
    router.push(`${path}${query ? `?q=${encodeURIComponent(query)}` : ""}`);
  }

  return (
    <form
      onSubmit={go}
      className={`flex items-stretch overflow-hidden rounded-lg border border-white/15 bg-black/30 focus-within:border-[#d26a2a]/70 ${className}`}
    >
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        aria-label="Search type"
        className="border-r border-white/10 bg-black/20 px-2 text-xs text-white/70 outline-none"
      >
        {OPTS.map((o) => (
          <option key={o.v} value={o.v} className="bg-[#200f0a]">
            {o.label}
          </option>
        ))}
      </select>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search…"
        className="min-w-0 flex-1 bg-transparent px-3 py-1.5 text-sm outline-none placeholder:text-white/40"
      />
      <button
        type="submit"
        aria-label="Search"
        className="px-3 text-white/50 hover:text-white"
      >
        ⌕
      </button>
    </form>
  );
}
