"use client";

import { useState } from "react";

// Click-to-play trailer. Shows a thumbnail until clicked, then loads the
// YouTube player inline (no new tab). A "Watch on YouTube" link is kept as a
// fallback for the rare videos whose channel disables embedding.
export function TrailerEmbed({ id }: { id: string }) {
  const [play, setPlay] = useState(false);

  return (
    <div className="mt-3 w-full max-w-2xl">
      {play ? (
        <div className="aspect-video w-full overflow-hidden rounded-xl border border-white/10">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
            title="Trailer"
            className="h-full w-full"
            style={{ border: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      ) : (
        <button
          onClick={() => setPlay(true)}
          className="group relative block aspect-video w-full overflow-hidden rounded-xl border border-white/10"
          aria-label="Play trailer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt="Trailer thumbnail"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition group-hover:bg-black/20">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FF0000] text-xl text-white shadow-lg">
              ▶
            </span>
          </span>
        </button>
      )}
      <a
        href={`https://www.youtube.com/watch?v=${id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-xs text-white/40 hover:text-white/70"
      >
        Trouble playing? Watch on YouTube ↗
      </a>
    </div>
  );
}
