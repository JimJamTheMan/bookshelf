import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Cover } from "../../_components/Cover";
import { toggleLike, addComment } from "./actions";
import { starsFromRating } from "@/lib/stars";
import { coverAspect } from "@/lib/format";

const MEDIA_COLOR: Record<string, string> = {
  book: "#4FBF7A", film: "#D94F4F", tv: "#4F7ED9",
  music: "#D94FB8", game: "#7A4FD9", art: "#BFA34F",
};

type Author = {
  id: string;
  handle: string;
  display_name: string | null;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getUTCDate()} ${m[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ logId: string }>;
}) {
  const { logId } = await params;
  const supabase = await createClient();

  const { data: log } = await supabase
    .from("logs")
    .select(
      "id, user_id, status, rating, review, like_count, comment_count, created_at, media:media_items(id, title, creator, release_year, cover_url, media_type)",
    )
    .eq("id", logId)
    .single();

  if (!log || !log.media) notFound();
  const media = log.media as unknown as {
    id: string; title: string; creator: string | null;
    release_year: number | null; cover_url: string | null; media_type: string;
  };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // author of the review
  const { data: authorData } = await supabase
    .from("profiles")
    .select("id, handle, display_name")
    .eq("id", log.user_id)
    .single();
  const author = authorData as Author | null;

  // has the current user liked it?
  let liked = false;
  if (user) {
    const { data: likeRow } = await supabase
      .from("review_likes")
      .select("log_id")
      .eq("user_id", user.id)
      .eq("log_id", logId)
      .maybeSingle();
    liked = !!likeRow;
  }

  // comments + their authors
  const { data: commentsRaw } = await supabase
    .from("review_comments")
    .select("id, user_id, body, created_at")
    .eq("log_id", logId)
    .order("created_at", { ascending: true });
  const comments = commentsRaw ?? [];

  const commenterIds = [...new Set(comments.map((c) => c.user_id))];
  const commenters: Record<string, Author> = {};
  if (commenterIds.length > 0) {
    const { data: cp } = await supabase
      .from("profiles")
      .select("id, handle, display_name")
      .in("id", commenterIds);
    for (const p of (cp ?? []) as Author[]) commenters[p.id] = p;
  }

  const color = MEDIA_COLOR[media.media_type] ?? "#888";

  return (
    <main className="min-h-screen bg-[#200f0a] text-[#e8c58f] px-4 py-8 sm:p-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/feed" className="text-sm text-white/50 hover:text-white/80">
          ← Feed
        </Link>

        {/* The review */}
        <div className="mt-4 flex gap-4 rounded-lg border border-white/10 bg-black/20 p-4">
          <div className="flex w-16 shrink-0 self-start overflow-hidden rounded border border-white/10">
            <div className="w-1 shrink-0" style={{ background: color }} />
            <div className={`${coverAspect(media.media_type)} flex-1 bg-black/30`}>
              <Cover src={media.cover_url} title={media.title} color={color} />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white/60">
              <Link
                href={`/u/${author?.handle ?? ""}`}
                className="font-medium text-white/90 hover:underline"
              >
                {author?.display_name || author?.handle || "Someone"}
              </Link>{" "}
              · {formatDate(log.created_at)}
            </p>
            <h1 className="mt-1 text-lg font-semibold leading-tight">
              {media.title}
            </h1>
            <p className="text-sm text-white/50">
              {media.creator ?? ""}
              {media.creator && media.release_year ? " · " : ""}
              {media.release_year ?? ""}
            </p>
            {log.rating ? (
              <p className="mt-1 text-sm text-[#f5d56b]">
                {starsFromRating(log.rating)}
              </p>
            ) : null}
            {log.review && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">
                {log.review}
              </p>
            )}
          </div>
        </div>

        {/* Like */}
        <form action={toggleLike} className="mt-4">
          <input type="hidden" name="log_id" value={log.id} />
          <button
            disabled={!user}
            className={
              liked
                ? "rounded border border-[#D94FB8]/50 bg-[#D94FB8]/15 px-4 py-2 text-sm font-medium text-[#e9a6d6]"
                : "rounded border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/5 disabled:opacity-40"
            }
          >
            {liked ? "♥ Liked" : "♡ Like"} · {log.like_count ?? 0}
          </button>
        </form>

        {/* Comments */}
        <h2 className="mt-8 text-sm font-medium uppercase tracking-wide text-white/40">
          {log.comment_count ?? comments.length} comments
        </h2>

        {user ? (
          <form action={addComment} className="mt-3 flex flex-col gap-2">
            <input type="hidden" name="log_id" value={log.id} />
            <textarea
              name="body"
              rows={2}
              required
              placeholder="Add a comment…"
              className="rounded border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40 resize-y"
            />
            <button className="self-start rounded bg-[#e8c58f] px-4 py-2 text-sm font-medium text-[#200f0a] hover:bg-white">
              Comment
            </button>
          </form>
        ) : (
          <p className="mt-3 text-sm text-white/50">
            <Link href="/login" className="underline">
              Log in
            </Link>{" "}
            to like or comment.
          </p>
        )}

        <ul className="mt-6 flex flex-col gap-4">
          {comments.map((c) => {
            const cp = commenters[c.user_id];
            return (
              <li key={c.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-white/50">
                  <Link
                    href={`/u/${cp?.handle ?? ""}`}
                    className="font-medium text-white/80 hover:underline"
                  >
                    {cp?.display_name || cp?.handle || "Someone"}
                  </Link>{" "}
                  · {formatDate(c.created_at)}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-white/85">
                  {c.body}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
