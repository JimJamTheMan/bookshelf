import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { starsFromRating } from "@/lib/stars";
import { statusLabel } from "@/lib/status";
import { displayTitle } from "@/lib/format";

const MEDIA_COLOR: Record<string, string> = {
  book: "#4FBF7A",
  film: "#D94F4F",
  tv: "#4F7ED9",
  music: "#D94FB8",
  game: "#7A4FD9",
  art: "#BFA34F",
};

type ShelfRow = {
  status: string;
  rating: number | null;
  media: {
    id: string;
    title: string;
    creator: string | null;
    release_year: number | null;
    cover_url: string | null;
    media_type: string;
  } | null;
};

export default async function ShelfPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; q?: string }>;
}) {
  const { message, q } = await searchParams;
  const query = (q ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("logs")
    .select(
      "status, rating, media:media_items(id, title, creator, release_year, cover_url, media_type)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  let rows = (data ?? []) as unknown as ShelfRow[];

  // Filter by title/creator if searching.
  if (query) {
    const needle = query.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.media &&
        ((r.media.title ?? "").toLowerCase().includes(needle) ||
          (r.media.creator ?? "").toLowerCase().includes(needle)),
    );
  }

  return (
    <main className="min-h-screen bg-[#15130f] text-[#f5f3ee] p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">My shelf</h1>
          <Link href="/" className="text-sm text-white/50 hover:text-white/80">
            ← Home
          </Link>
        </div>

        <form method="get" className="mt-6 flex gap-3">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search your shelf by title or creator…"
            className="flex-1 rounded border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40"
          />
          <button className="rounded bg-[#f5f3ee] px-4 py-2 text-sm font-medium text-[#15130f] hover:bg-white">
            Search
          </button>
          {query && (
            <Link
              href="/shelf"
              className="rounded border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/5"
            >
              Clear
            </Link>
          )}
        </form>

        {message && (
          <p className="mt-4 rounded bg-[#4FBF7A]/15 border border-[#4FBF7A]/30 p-3 text-sm text-[#9be3b8]">
            {message}
          </p>
        )}

        {rows.length === 0 ? (
          <div className="mt-10 text-center text-sm text-white/50">
            {query ? (
              <p>Nothing on your shelf matches “{query}”.</p>
            ) : (
              <>
                <p>Your shelf is empty.</p>
                <Link
                  href="/books"
                  className="mt-4 inline-block rounded bg-[#f5f3ee] px-4 py-2 font-medium text-[#15130f] hover:bg-white"
                >
                  Search for something to log
                </Link>
              </>
            )}
          </div>
        ) : (
          <ul className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {rows.map((row) =>
              row.media ? (
                <li key={row.media.id}>
                  <Link href={`/media/${row.media.id}`}>
                    <div className="flex overflow-hidden rounded border border-white/10">
                      <div
                        className="w-1 shrink-0"
                        style={{
                          background:
                            MEDIA_COLOR[row.media.media_type] ?? "#888",
                        }}
                      />
                      <div className="relative aspect-[2/3] flex-1 bg-black/30">
                        {row.media.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.media.cover_url}
                            alt={`Cover of ${row.media.title}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-white/80"
                            style={{
                              background: `linear-gradient(160deg, ${
                                MEDIA_COLOR[row.media.media_type] ?? "#888"
                              }33, #15130f)`,
                            }}
                          >
                            {row.media.title}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                  <p className="mt-2 line-clamp-2 text-sm font-medium leading-tight">
                    {displayTitle(
                      row.media.title,
                      row.media.release_year,
                      row.media.media_type,
                    )}
                  </p>
                  {row.media.creator && (
                    <p className="line-clamp-1 text-xs text-white/40">
                      {row.media.creator}
                    </p>
                  )}
                  <p className="text-xs text-white/50">
                    {statusLabel(row.media.media_type, row.status)}
                    {row.rating ? ` · ${starsFromRating(row.rating)}` : ""}
                  </p>
                </li>
              ) : null,
            )}
          </ul>
        )}
      </div>
    </main>
  );
}
