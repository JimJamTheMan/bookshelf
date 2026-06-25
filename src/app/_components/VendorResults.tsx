"use client";

import { useState } from "react";
import { Cover } from "./Cover";
import { coverAspect } from "@/lib/format";
import { openMedia, startLog } from "@/app/media-actions";
import type { SearchHit } from "@/lib/search-all";

const MEDIA_COLOR: Record<string, string> = {
  book: "#4FBF7A",
  film: "#D94F4F",
  tv: "#4F7ED9",
  music: "#D94FB8",
  game: "#7A4FD9",
  art: "#BFA34F",
};

// Render order for the grouped result sections.
const SECTIONS = [
  { type: "film", label: "Films" },
  { type: "tv", label: "TV" },
  { type: "game", label: "Games" },
  { type: "music", label: "Music" },
  { type: "book", label: "Books" },
  { type: "art", label: "Art" },
];

function Tile({ h }: { h: SearchHit }) {
  const color = MEDIA_COLOR[h.mediaType] ?? "#888";
  return (
    <li>
      <div className="flex overflow-hidden rounded border border-white/10">
        <div className="w-1 shrink-0" style={{ background: color }} />
        <div className={`${coverAspect(h.mediaType)} flex-1 bg-black/30`}>
          <Cover src={h.coverUrl} title={h.title} color={color} />
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-medium leading-tight">
        {h.title}
      </p>
      <p className="line-clamp-1 text-xs text-white/50">
        {h.creator ?? ""}
        {h.creator && h.year ? " · " : ""}
        {h.year ?? ""}
      </p>
      <form action={openMedia} className="mt-2 flex gap-2">
        <input type="hidden" name="media_type" value={h.mediaType} />
        <input type="hidden" name="source" value={h.source} />
        <input type="hidden" name="source_id" value={h.sourceId} />
        <input type="hidden" name="title" value={h.title} />
        <input type="hidden" name="creator" value={h.creator ?? ""} />
        <input type="hidden" name="release_year" value={h.year ?? ""} />
        <input type="hidden" name="cover_url" value={h.coverUrl ?? ""} />
        <button className="flex-1 rounded bg-[#e8c58f] px-2 py-1.5 text-xs font-medium text-[#200f0a] hover:bg-white">
          View
        </button>
        <button
          formAction={startLog}
          className="flex-1 rounded border border-white/20 px-2 py-1.5 text-xs font-medium hover:bg-white/5"
        >
          Log
        </button>
      </form>
    </li>
  );
}

// Grouped, type-tagged results from the unified vendor search, with a
// media-type filter.
export function VendorResults({ hits }: { hits: SearchHit[] }) {
  const [filter, setFilter] = useState("all");

  if (hits.length === 0) {
    return (
      <p className="mt-6 text-sm text-white/50">
        No results found. Try a different spelling.
      </p>
    );
  }

  // Only offer chips for types that actually have results.
  const present = SECTIONS.map((s) => ({
    ...s,
    count: hits.filter((h) => h.mediaType === s.type).length,
  })).filter((s) => s.count > 0);

  const shown =
    filter === "all" ? present : present.filter((s) => s.type === filter);

  const chip = (key: string, label: string, active: boolean) => (
    <button
      key={key}
      onClick={() => setFilter(key)}
      className={
        active
          ? "rounded-full px-3 py-1 text-sm font-medium text-[#200f0a]"
          : "rounded-full border border-white/15 px-3 py-1 text-sm text-white/70 hover:bg-white/5"
      }
      style={active ? { background: "#d26a2a" } : undefined}
    >
      {label}
    </button>
  );

  return (
    <>
      {/* Media-type filter */}
      <div className="mt-6 flex flex-wrap gap-2">
        {chip("all", `All (${hits.length})`, filter === "all")}
        {present.map((s) => chip(s.type, `${s.label} (${s.count})`, filter === s.type))}
      </div>

      {shown.map((sec) => {
        const items = hits.filter((h) => h.mediaType === sec.type);
        return (
          <section key={sec.type} className="mt-8">
            <h2 className="text-sm font-medium uppercase tracking-wide text-white/40">
              {sec.label}
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {items.map((h) => (
                <Tile key={`${h.source}-${h.sourceId}`} h={h} />
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
