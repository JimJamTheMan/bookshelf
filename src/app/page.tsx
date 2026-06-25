import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";
import { HomeLibrary, type LibItem } from "./HomeLibrary";

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

  let unread = 0;
  let items: LibItem[] = [];

  if (user) {
    const [{ count }, { data }] = await Promise.all([
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .eq("is_read", false),
      supabase
        .from("logs")
        .select(
          "rating, created_at, media:media_items(id, title, creator, cover_url, media_type)",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    unread = count ?? 0;
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

  // Cover wall built from the user's own covers (repeated to fill the band).
  const covers = items.map((i) => i.cover_url).filter(Boolean) as string[];
  const wall = covers.length
    ? Array.from({ length: 40 }, (_, i) => covers[i % covers.length])
    : [];

  return (
    <main className="min-h-screen bg-[#0f0d0b] font-mono text-[#f5f3ee]">
      {/* Top nav */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 px-6 py-4 text-sm">
        <nav className="flex flex-wrap gap-x-5 gap-y-1 text-white/60">
          {user ? (
            <>
              <Link href="/feed" className="hover:text-white">Feed</Link>
              <Link href="/discover" className="hover:text-white">Discover</Link>
              <Link href="/recommendations" className="hover:text-white">For you</Link>
              <Link href="/timeline" className="hover:text-white">Timeline</Link>
              <Link href="/shelf" className="hover:text-white">Shelf</Link>
              <Link href="/lists" className="hover:text-white">Lists</Link>
              <Link href="/profile" className="hover:text-white">Profile</Link>
            </>
          ) : (
            <span className="text-white/40">Your diary for everything you read, watch, play &amp; hear</span>
          )}
        </nav>
        <div className="flex items-center gap-x-5">
          {user ? (
            <>
              <Link href="/notifications" className="relative text-white/60 hover:text-white">
                Notifications
                {unread > 0 && (
                  <span className="ml-1 rounded-full bg-[#D94F4F] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {unread}
                  </span>
                )}
              </Link>
              <Link href="/account" className="text-white/60 hover:text-white">Settings</Link>
              <form action={logout}>
                <button className="text-white/60 hover:text-white">Log out</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="text-white/80 hover:text-white">Login</Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        {/* Cover wall + glow (top band only) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[620px] overflow-hidden">
          {wall.length > 0 && (
            <div className="grid grid-cols-6 gap-1.5 opacity-[0.16] blur-[1px] sm:grid-cols-8 md:grid-cols-10">
              {wall.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="aspect-[2/3] w-full object-cover"
                />
              ))}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f0d0b]/70 via-[#0f0d0b]/85 to-[#0f0d0b]" />
          <div
            className="absolute left-1/2 top-16 h-[440px] w-[860px] max-w-[95vw] -translate-x-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(247,162,59,0.50), rgba(247,140,40,0.14) 45%, transparent 70%)",
              filter: "blur(50px)",
            }}
          />
        </div>

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
                className="inline-block rounded-lg px-6 py-3 text-sm font-semibold text-[#0f0d0b]"
                style={{ background: ACCENT }}
              >
                Log in or sign up
              </Link>
              <p className="mt-4 text-xs text-white/40">
                Log everything you read, watch, play and hear — in one colour-coded diary.
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="h-16" />
    </main>
  );
}
