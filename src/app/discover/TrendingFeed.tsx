"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Cover } from "../_components/Cover";
import { coverAspect, displayTitle } from "@/lib/format";
import { openMedia } from "@/app/media-actions";
import type { TrendingItem } from "@/lib/tmdb";

const MEDIA_COLOR: Record<string, string> = {
  book: "#4FBF7A", film: "#D94F4F", tv: "#4F7ED9",
  music: "#D94FB8", game: "#7A4FD9", art: "#BFA34F",
};

const keyOf = (m: TrendingItem) => `${m.mediaType}-${m.sourceId}`;

export function TrendingFeed({ initial }: { initial: TrendingItem[] }) {
  const [items, setItems] = useState<TrendingItem[]>(initial);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || done) return;
    setLoading(true);
    const next = page + 1;
    try {
      const res = await fetch(`/api/trending?page=${next}`);
      const data: TrendingItem[] = res.ok ? await res.json() : [];
      setItems((prev) => {
        const seen = new Set(prev.map(keyOf));
        const fresh = data.filter((m) => !seen.has(keyOf(m)));
        return [...prev, ...fresh];
      });
      setPage(next);
      if (data.length === 0 || next >= 100) setDone(true);
    } catch {
      setDone(true);
    } finally {
      setLoading(false);
    }
  }, [loading, done, page]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "600px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  return (
    <>
      <ul className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((m) => {
          const color = MEDIA_COLOR[m.mediaType] ?? "#888";
          return (
            <li key={keyOf(m)}>
              <form action={openMedia}>
                <input type="hidden" name="media_type" value={m.mediaType} />
                <input type="hidden" name="source" value={m.source} />
                <input type="hidden" name="source_id" value={m.sourceId} />
                <input type="hidden" name="title" value={m.title} />
                <input type="hidden" name="release_year" value={m.year ?? ""} />
                <input type="hidden" name="cover_url" value={m.coverUrl ?? ""} />
                <input
                  type="hidden"
                  name="description"
                  value={m.description ?? ""}
                />
                <button type="submit" className="block w-full text-left">
                  <div className="flex overflow-hidden rounded border border-white/10">
                    <div className="w-1 shrink-0" style={{ background: color }} />
                    <div className={`${coverAspect(m.mediaType)} flex-1 bg-black/30`}>
                      <Cover src={m.coverUrl} title={m.title} color={color} />
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-medium leading-tight">
                    {displayTitle(m.title, m.year, m.mediaType)}
                  </p>
                </button>
              </form>
            </li>
          );
        })}
      </ul>

      {loading && (
        <p className="mt-6 text-center text-sm text-white/40">Loading…</p>
      )}
      {!done && <div ref={sentinel} className="h-8" />}
    </>
  );
}
