"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Cover } from "./_components/Cover";
import { starsFromRating } from "@/lib/stars";
import { coverAspect } from "@/lib/format";

const ACCENT = "#F7A23B";

const MEDIA_COLOR: Record<string, string> = {
  book: "#4FBF7A", film: "#D94F4F", tv: "#4F7ED9",
  music: "#D94FB8", game: "#7A4FD9", art: "#BFA34F",
};

const TABS = [
  { key: "all", label: "All" },
  { key: "book", label: "Books" },
  { key: "music", label: "Music" },
  { key: "film", label: "Film" },
  { key: "tv", label: "TV" },
  { key: "game", label: "Games" },
  { key: "art", label: "Art" },
];

const NOUN: Record<string, string> = {
  all: "logs", book: "books", music: "albums", film: "films", tv: "shows",
  game: "games", art: "artworks",
};

export type LibItem = {
  id: string;
  title: string;
  creator: string | null;
  cover_url: string | null;
  media_type: string;
  rating: number | null;
  created_at: string;
};

function loggedDate(iso: string): string {
  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const d = new Date(iso);
  return `logged ${m[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function HomeLibrary({ items }: { items: LibItem[] }) {
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter(
      (it) =>
        (tab === "all" || it.media_type === tab) &&
        (!needle ||
          it.title.toLowerCase().includes(needle) ||
          (it.creator ?? "").toLowerCase().includes(needle)),
    );
  }, [items, tab, q]);

  return (
    <div className="font-mono">
      {/* Search */}
      <div className="mx-auto mt-8 flex max-w-2xl items-center gap-3 rounded-xl border border-white/15 bg-black/40 px-4 py-3 backdrop-blur focus-within:border-[#F7A23B]/70">
        <span className="text-white/40">⌕</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search your library..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className="text-white/40 hover:text-white"
            aria-label="Clear"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              tab === t.key
                ? "border-b-2 pb-1 font-semibold"
                : "pb-1 text-white/55 hover:text-white/90"
            }
            style={tab === t.key ? { color: ACCENT, borderColor: ACCENT } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Recently logged */}
      <div className="mx-auto mt-10 max-w-6xl px-6">
        <h2 className="text-lg font-bold" style={{ color: ACCENT }}>
          Recently logged{" "}
          <span className="text-sm font-normal text-white/40">
            your {NOUN[tab] ?? "media"} diary · {filtered.length}
          </span>
        </h2>

        {filtered.length === 0 ? (
          <p className="mt-6 text-sm text-white/50">
            {items.length === 0
              ? "Nothing logged yet — search a title to add it."
              : "Nothing here matches."}
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
            {filtered.map((it) => {
              const color = MEDIA_COLOR[it.media_type] ?? "#888";
              return (
                <li key={it.id}>
                  <Link href={`/media/${it.id}`}>
                    <div className="tile flex overflow-hidden rounded border border-white/10">
                      <div className="w-1 shrink-0" style={{ background: color }} />
                      <div className={`${coverAspect(it.media_type)} flex-1 bg-black/30`}>
                        <Cover src={it.cover_url} title={it.title} color={color} />
                      </div>
                    </div>
                  </Link>
                  <p className="mt-1 text-[11px] text-[#f5d56b]">
                    {it.rating ? starsFromRating(it.rating) : " "}
                  </p>
                  <p className="text-[11px] text-white/40">
                    {loggedDate(it.created_at)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
