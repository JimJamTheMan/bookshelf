import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { HomeLibrary, type LibItem } from "./HomeLibrary";
import { ShelfBg } from "./_components/ShelfBg";
import { Cover } from "./_components/Cover";
import { statusLabel } from "@/lib/status";
import { coverAspect } from "@/lib/format";

const ACCENT = "#d26a2a";

const MEDIA_COLOR: Record<string, string> = {
  book: "#4FBF7A",
  film: "#D94F4F",
  tv: "#4F7ED9",
  music: "#D94FB8",
  game: "#7A4FD9",
  art: "#BFA34F",
};

type CurrentItem = {
  id: string;
  title: string;
  cover_url: string | null;
  media_type: string;
  status: string;
};

const ADD = [
  { href: "/books", label: "Books" },
  { href: "/films", label: "Films" },
  { href: "/tv", label: "TV" },
  { href: "/games", label: "Games" },
  { href: "/music", label: "Music" },
  { href: "/art", label: "Art" },
];

type LogRow = {
  status: string;
  rating: number | null;
  created_at: string;
  media: {
    id: string;
    title: string;
    creator: string | null;
    cover_url: string | null;
    media_type: string;
  } | null;
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let items: LibItem[] = [];
  let currently: CurrentItem[] = [];
  const stats = { total: 0, thisYear: 0, avg: null as number | null, wantTo: 0 };

  if (user) {
    const { data } = await supabase
      .from("logs")
      .select(
        "status, rating, created_at, media:media_items(id, title, creator, cover_url, media_type)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const rows = ((data ?? []) as unknown as LogRow[]).filter((r) => r.media);

    items = rows.map((r) => ({
      id: r.media!.id,
      title: r.media!.title,
      creator: r.media!.creator,
      cover_url: r.media!.cover_url,
      media_type: r.media!.media_type,
      rating: r.rating,
      created_at: r.created_at,
    }));

    const year = new Date().getFullYear();
    const rated = rows.filter((r) => r.rating != null);
    stats.total = rows.length;
    stats.thisYear = rows.filter(
      (r) => new Date(r.created_at).getFullYear() === year,
    ).length;
    stats.avg = rated.length
      ? rated.reduce((s, r) => s + (r.rating as number), 0) / rated.length / 2
      : null;
    stats.wantTo = rows.filter((r) => r.status === "planned").length;

    currently = rows
      .filter((r) => r.status === "in_progress")
      .slice(0, 12)
      .map((r) => ({
        id: r.media!.id,
        title: r.media!.title,
        cover_url: r.media!.cover_url,
        media_type: r.media!.media_type,
        status: r.status,
      }));
  }

  return (
    <main className="min-h-screen bg-[#200f0a] font-mono text-[#e8c58f]">
      {/* Hero */}
      <section className="relative">
        {/* Bookshelf background image + glow (top band only) */}
        <ShelfBg />

        {/* Hero content */}
        <div className="relative z-10 px-6 pt-12 text-center">
          <h1
            className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl"
            style={{ color: ACCENT, textShadow: "0 0 45px rgba(210,106,42,0.55)" }}
          >
            Bookshelf
          </h1>
          <p className="mt-3 text-sm tracking-wide text-white/60">
            Your diary for books · music · film · tv · games · art
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-white/45">
            <span className="text-white/30">Add to library:</span>
            {ADD.map((m) => (
              <Link key={m.href} href={m.href} className="hover:text-[#d26a2a]">
                {m.label}
              </Link>
            ))}
          </div>

          {user ? (
            <>
              {/* Goodreads-style stats strip */}
              <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 font-mono sm:grid-cols-4">
                {[
                  { label: "Logged", value: String(stats.total) },
                  { label: "This year", value: String(stats.thisYear) },
                  {
                    label: "Avg rating",
                    value: stats.avg ? `★ ${stats.avg.toFixed(1)}` : "—",
                  },
                  { label: "Want to", value: String(stats.wantTo) },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                  >
                    <div
                      className="text-2xl font-bold"
                      style={{ color: ACCENT }}
                    >
                      {s.value}
                    </div>
                    <div className="text-[11px] uppercase tracking-wide text-white/40">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Currently — what you're in the middle of (Goodreads-style) */}
              {currently.length > 0 && (
                <section className="mx-auto mt-10 max-w-6xl px-6 text-left">
                  <h2 className="font-mono text-lg font-bold" style={{ color: ACCENT }}>
                    Currently
                  </h2>
                  <ul className="mt-3 flex gap-4 overflow-x-auto pb-2">
                    {currently.map((c) => {
                      const color = MEDIA_COLOR[c.media_type] ?? "#888";
                      return (
                        <li key={c.id} className="w-28 shrink-0">
                          <Link href={`/media/${c.id}`}>
                            <div className="tile flex overflow-hidden rounded border border-white/10">
                              <div
                                className="w-1 shrink-0"
                                style={{ background: color }}
                              />
                              <div className={`${coverAspect(c.media_type)} flex-1 bg-black/30`}>
                                <Cover
                                  src={c.cover_url}
                                  title={c.title}
                                  color={color}
                                />
                              </div>
                            </div>
                          </Link>
                          <p className="mt-1 line-clamp-1 text-xs font-medium">
                            {c.title}
                          </p>
                          <p className="text-[11px]" style={{ color: ACCENT }}>
                            {statusLabel(c.media_type, c.status)}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              <HomeLibrary items={items} />
            </>
          ) : (
            <div className="mx-auto mt-10 max-w-md">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/login"
                  className="inline-block rounded-lg px-6 py-3 text-sm font-semibold text-[#200f0a]"
                  style={{ background: ACCENT }}
                >
                  Log in or sign up
                </Link>
                <Link
                  href="/discover"
                  className="inline-block rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold text-white/80 hover:bg-white/5"
                >
                  Explore without an account
                </Link>
              </div>
              <p className="mt-4 text-xs text-white/40">
                Browse films, TV, music, books, games and art — sign up to start
                logging your own.
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="h-16" />
    </main>
  );
}
