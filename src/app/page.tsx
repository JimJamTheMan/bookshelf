import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { HomeLibrary, type LibItem } from "./HomeLibrary";
import { ShelfBg } from "./_components/ShelfBg";

const ACCENT = "#F7A23B";

const ADD = [
  { href: "/books", label: "Books" },
  { href: "/films", label: "Films" },
  { href: "/tv", label: "TV" },
  { href: "/games", label: "Games" },
  { href: "/music", label: "Music" },
  { href: "/art", label: "Art" },
];

type LogRow = {
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

  if (user) {
    const { data } = await supabase
      .from("logs")
      .select(
        "rating, created_at, media:media_items(id, title, creator, cover_url, media_type)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    items = ((data ?? []) as unknown as LogRow[])
      .filter((r) => r.media)
      .map((r) => ({
        id: r.media!.id,
        title: r.media!.title,
        creator: r.media!.creator,
        cover_url: r.media!.cover_url,
        media_type: r.media!.media_type,
        rating: r.rating,
        created_at: r.created_at,
      }));
  }

  return (
    <main className="min-h-screen bg-[#15130f] font-mono text-[#f5f3ee]">
      {/* Hero */}
      <section className="relative">
        {/* Bookshelf background image + glow (top band only) */}
        <ShelfBg />

        {/* Hero content */}
        <div className="relative z-10 px-6 pt-12 text-center">
          <h1
            className="text-6xl font-extrabold tracking-tight sm:text-7xl"
            style={{ color: ACCENT, textShadow: "0 0 45px rgba(247,162,59,0.55)" }}
          >
            Bookshelf
          </h1>
          <p className="mt-3 text-sm tracking-wide text-white/60">
            Your diary for books · music · film · tv · games · art
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-white/45">
            <span className="text-white/30">Add to library:</span>
            {ADD.map((m) => (
              <Link key={m.href} href={m.href} className="hover:text-[#F7A23B]">
                {m.label}
              </Link>
            ))}
          </div>

          {user ? (
            <HomeLibrary items={items} />
          ) : (
            <div className="mx-auto mt-10 max-w-md">
              <Link
                href="/login"
                className="inline-block rounded-lg px-6 py-3 text-sm font-semibold text-[#15130f]"
                style={{ background: ACCENT }}
              >
                Log in or sign up
              </Link>
              <p className="mt-4 text-xs text-white/40">
                Log everything you read, watch, play and hear — in one
                colour-coded diary.
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="h-16" />
    </main>
  );
}
