import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Cover } from "../../_components/Cover";
import { starsFromRating } from "@/lib/stars";
import { fetchMediaDetails } from "@/lib/media-details";

const MEDIA_COLOR: Record<string, string> = {
  book: "#4FBF7A", film: "#D94F4F", tv: "#4F7ED9",
  music: "#D94FB8", game: "#7A4FD9", art: "#BFA34F",
};

const MEDIA_LABEL: Record<string, string> = {
  book: "Book", film: "Film", tv: "TV", music: "Music", game: "Game", art: "Art",
};

const SEARCH_PATH: Record<string, string> = {
  book: "/books", film: "/films", tv: "/tv",
  music: "/music", game: "/games", art: "/art",
};

type Author = { id: string; handle: string; display_name: string | null };

function formatDate(iso: string): string {
  const d = new Date(iso);
  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getUTCDate()} ${m[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export default async function MediaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: media } = await supabase
    .from("media_items")
    .select(
      "id, media_type, source, source_id, title, creator, release_year, cover_url, description, avg_rating, log_count",
    )
    .eq("id", id)
    .single();

  if (!media) notFound();

  const color = MEDIA_COLOR[media.media_type] ?? "#888";

  // Pull richer info straight from the original source (cached for a day).
  const details = await fetchMediaDetails(
    media.media_type,
    media.source,
    media.source_id,
  );
  const description = details?.description || media.description || null;
  const facts = details?.facts ?? [];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The current user's own log for this item (if any).
  let myLog: { status: string; rating: number | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from("logs")
      .select("status, rating")
      .eq("user_id", user.id)
      .eq("media_id", id)
      .maybeSingle();
    myLog = data;
  }

  // Everyone's written reviews for this item.
  const { data: reviewsRaw } = await supabase
    .from("logs")
    .select("id, user_id, rating, review, created_at")
    .eq("media_id", id)
    .not("review", "is", null)
    .order("created_at", { ascending: false })
    .limit(30);
  const reviews = reviewsRaw ?? [];

  const authorIds = [...new Set(reviews.map((r) => r.user_id))];
  const authors: Record<string, Author> = {};
  if (authorIds.length > 0) {
    const { data: ap } = await supabase
      .from("profiles")
      .select("id, handle, display_name")
      .in("id", authorIds);
    for (const a of (ap ?? []) as Author[]) authors[a.id] = a;
  }

  const avg = media.avg_rating != null ? Number(media.avg_rating) : null;

  return (
    <main className="min-h-screen bg-[#15130f] text-[#f5f3ee] p-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href={SEARCH_PATH[media.media_type] ?? "/"}
          className="text-sm text-white/50 hover:text-white/80"
        >
          ← Back to search
        </Link>

        {/* Header */}
        <div className="mt-4 flex gap-6">
          <div className="flex w-32 shrink-0 self-start overflow-hidden rounded border border-white/10">
            <div className="w-1.5 shrink-0" style={{ background: color }} />
            <div className="aspect-[2/3] flex-1 bg-black/30">
              <Cover src={media.cover_url} title={media.title} color={color} />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <span
              className="inline-block rounded px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide"
              style={{ background: `${color}22`, color }}
            >
              {MEDIA_LABEL[media.media_type] ?? media.media_type}
            </span>
            <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight">
              {media.title}
            </h1>
            <p className="mt-1 text-sm text-white/50">
              {media.creator ?? ""}
              {media.creator && media.release_year ? " · " : ""}
              {media.release_year ?? ""}
            </p>

            <div className="mt-3 flex items-center gap-4 text-sm">
              {avg != null ? (
                <span className="text-[#f5d56b]">
                  {(avg / 2).toFixed(1)}/5 ★
                </span>
              ) : (
                <span className="text-white/40">No ratings yet</span>
              )}
              <span className="text-white/40">
                {media.log_count ?? 0} log{(media.log_count ?? 0) === 1 ? "" : "s"}
              </span>
            </div>

            <div className="mt-4">
              {user ? (
                <Link
                  href={`/log/${media.id}`}
                  className="inline-block rounded bg-[#f5f3ee] px-4 py-2 text-sm font-medium text-[#15130f] hover:bg-white"
                >
                  {myLog ? "Edit your log" : "Log this"}
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-block rounded bg-[#f5f3ee] px-4 py-2 text-sm font-medium text-[#15130f] hover:bg-white"
                >
                  Log in to add this
                </Link>
              )}
            </div>
          </div>
        </div>

        {description && (
          <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-white/80">
            {description}
          </p>
        )}

        {facts.length > 0 && (
          <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
            {facts.map((f) => (
              <div key={f.label} className="flex gap-2 text-sm">
                <dt className="shrink-0 text-white/40">{f.label}:</dt>
                <dd className="text-white/80">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {/* Reviews */}
        <h2 className="mt-10 text-sm font-medium uppercase tracking-wide text-white/40">
          Reviews
        </h2>
        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-white/50">
            No written reviews yet — be the first.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {reviews.map((r) => {
              const a = authors[r.user_id];
              return (
                <li
                  key={r.id}
                  className="rounded-lg border border-white/10 bg-black/20 p-4"
                >
                  <p className="text-sm text-white/60">
                    <Link
                      href={`/u/${a?.handle ?? ""}`}
                      className="font-medium text-white/90 hover:underline"
                    >
                      {a?.display_name || a?.handle || "Someone"}
                    </Link>
                    {r.rating ? (
                      <span className="text-[#f5d56b]">
                        {" · "}
                        {starsFromRating(r.rating)}
                      </span>
                    ) : null}
                    <span className="text-white/40">
                      {" · "}
                      {formatDate(r.created_at)}
                    </span>
                  </p>
                  <Link href={`/review/${r.id}`} className="block">
                    <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-white/80 hover:text-white">
                      {r.review}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
