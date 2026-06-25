import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Cover } from "../_components/Cover";
import { starsFromRating } from "@/lib/stars";
import { coverAspect, displayTitle } from "@/lib/format";

const STATUS_VERB: Record<string, Record<string, string>> = {
  book: { planned: "wants to read", in_progress: "is reading", completed: "read", on_hold: "paused", dropped: "dropped" },
  film: { planned: "wants to watch", in_progress: "is watching", completed: "watched", on_hold: "paused", dropped: "dropped" },
  tv: { planned: "wants to watch", in_progress: "is watching", completed: "watched", on_hold: "paused", dropped: "dropped" },
  music: { planned: "wants to hear", in_progress: "is listening to", completed: "listened to", on_hold: "paused", dropped: "dropped" },
  game: { planned: "wants to play", in_progress: "is playing", completed: "played", on_hold: "paused", dropped: "dropped" },
  art: { planned: "wants to see", in_progress: "is viewing", completed: "saw", on_hold: "paused", dropped: "dropped" },
};

const MEDIA_COLOR: Record<string, string> = {
  book: "#4FBF7A", film: "#D94F4F", tv: "#4F7ED9",
  music: "#D94FB8", game: "#7A4FD9", art: "#BFA34F",
};

type Author = {
  id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
};

type FeedRow = {
  id: string;
  user_id: string;
  status: string;
  rating: number | null;
  review: string | null;
  created_at: string;
  media: {
    id: string;
    title: string;
    creator: string | null;
    release_year: number | null;
    cover_url: string | null;
    media_type: string;
  } | null;
};

function verb(mediaType: string, status: string): string {
  return STATUS_VERB[mediaType]?.[status] ?? status;
}

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Who do I follow?
  const { data: follows } = await supabase
    .from("follows")
    .select("followee_id")
    .eq("follower_id", user.id);
  const followeeIds = (follows ?? []).map((f) => f.followee_id);

  let rows: FeedRow[] = [];
  const authors: Record<string, Author> = {};

  if (followeeIds.length > 0) {
    const { data } = await supabase
      .from("logs")
      .select(
        "id, user_id, status, rating, review, created_at, media:media_items(id, title, creator, release_year, cover_url, media_type)",
      )
      .in("user_id", followeeIds)
      .order("created_at", { ascending: false })
      .limit(50);
    rows = (data ?? []) as unknown as FeedRow[];

    const { data: profs } = await supabase
      .from("profiles")
      .select("id, handle, display_name, avatar_url")
      .in("id", followeeIds);
    for (const p of (profs ?? []) as Author[]) authors[p.id] = p;
  }

  return (
    <main className="min-h-screen bg-[#200f0a] text-[#e8c58f] px-4 py-8 sm:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Feed</h1>
          <Link href="/" className="text-sm text-white/50 hover:text-white/80">
            ← Home
          </Link>
        </div>
        <p className="mt-1 text-sm text-white/50">
          Activity from people you follow.
        </p>

        {followeeIds.length === 0 ? (
          <p className="mt-10 text-center text-sm text-white/50">
            You&apos;re not following anyone yet. Visit someone&apos;s profile
            (e.g. <span className="text-white/70">/u/their-handle</span>) and hit
            Follow to fill your feed.
          </p>
        ) : rows.length === 0 ? (
          <p className="mt-10 text-center text-sm text-white/50">
            The people you follow haven&apos;t logged anything yet.
          </p>
        ) : (
          <ul className="mt-8 flex flex-col gap-4">
            {rows.map((row, i) => {
              if (!row.media) return null;
              const author = authors[row.user_id];
              const color = MEDIA_COLOR[row.media.media_type] ?? "#888";
              return (
                <li
                  key={`${row.user_id}-${row.media.id}-${i}`}
                  className="flex gap-4 rounded-lg border border-white/10 bg-black/20 p-4"
                >
                  <Link
                    href={`/media/${row.media.id}`}
                    className="flex w-14 shrink-0 self-start overflow-hidden rounded border border-white/10"
                  >
                    <div className="w-1 shrink-0" style={{ background: color }} />
                    <div className={`${coverAspect(row.media.media_type)} flex-1 bg-black/30`}>
                      <Cover
                        src={row.media.cover_url}
                        title={row.media.title}
                        color={color}
                      />
                    </div>
                  </Link>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white/70">
                      <Link
                        href={`/u/${author?.handle ?? ""}`}
                        className="font-medium text-white/90 hover:underline"
                      >
                        {author?.display_name || author?.handle || "Someone"}
                      </Link>{" "}
                      {verb(row.media.media_type, row.status)}{" "}
                      <Link
                        href={`/review/${row.id}`}
                        className="font-medium text-white/90 hover:underline"
                      >
                        {displayTitle(
                          row.media.title,
                          row.media.release_year,
                          row.media.media_type,
                        )}
                      </Link>
                      {row.rating ? (
                        <span className="text-[#f5d56b]">
                          {" "}
                          {starsFromRating(row.rating)}
                        </span>
                      ) : null}
                    </p>
                    {row.media.creator && (
                      <p className="text-xs text-white/40">{row.media.creator}</p>
                    )}
                    {row.review && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">
                        {row.review}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
