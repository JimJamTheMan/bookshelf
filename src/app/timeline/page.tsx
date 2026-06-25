import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Cover } from "../_components/Cover";
import { starsFromRating } from "@/lib/stars";
import { coverAspect } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  planned: "Wants to try",
  in_progress: "In progress",
  completed: "Finished",
  on_hold: "On hold",
  dropped: "Dropped",
};

const MEDIA_COLOR: Record<string, string> = {
  book: "#4FBF7A",
  film: "#D94F4F",
  tv: "#4F7ED9",
  music: "#D94FB8",
  game: "#7A4FD9",
  art: "#BFA34F",
};

const MEDIA_LABEL: Record<string, string> = {
  book: "Book",
  film: "Film",
  tv: "TV",
  music: "Music",
  game: "Game",
  art: "Art",
};

type Row = {
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

function formatDate(iso: string): string {
  // Avoid locale ambiguity: render as e.g. "22 Jun 2026".
  const d = new Date(iso);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export default async function TimelinePage() {
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
      "status, rating, review, created_at, media:media_items(id, title, creator, release_year, cover_url, media_type)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Row[];

  return (
    <main className="min-h-screen text-[#e8c58f] px-4 py-8 sm:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Timeline</h1>
          <Link href="/" className="text-sm text-white/50 hover:text-white/80">
            ← Home
          </Link>
        </div>
        <p className="mt-1 text-sm text-white/50">
          Everything you&apos;ve logged, newest first.
        </p>

        {rows.length === 0 ? (
          <div className="mt-10 text-center text-sm text-white/50">
            <p>Nothing logged yet.</p>
            <Link
              href="/"
              className="mt-4 inline-block rounded bg-[#e8c58f] px-4 py-2 font-medium text-[#200f0a] hover:bg-white"
            >
              Log something
            </Link>
          </div>
        ) : (
          <ul className="mt-8 flex flex-col gap-4">
            {rows.map((row, i) =>
              row.media ? (
                <li
                  key={`${row.media.id}-${i}`}
                  className="flex gap-4 rounded-lg border border-white/10 bg-black/20 p-4"
                >
                  <Link
                    href={`/media/${row.media.id}`}
                    className="flex w-16 shrink-0 overflow-hidden rounded border border-white/10 self-start"
                  >
                    <div
                      className="w-1 shrink-0"
                      style={{
                        background: MEDIA_COLOR[row.media.media_type] ?? "#888",
                      }}
                    />
                    <div className={`${coverAspect(row.media.media_type)} flex-1 bg-black/30`}>
                      <Cover
                        src={row.media.cover_url}
                        title={row.media.title}
                        color={MEDIA_COLOR[row.media.media_type] ?? "#888"}
                      />
                    </div>
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                        style={{
                          background: `${MEDIA_COLOR[row.media.media_type] ?? "#888"}22`,
                          color: MEDIA_COLOR[row.media.media_type] ?? "#aaa",
                        }}
                      >
                        {MEDIA_LABEL[row.media.media_type] ?? row.media.media_type}
                      </span>
                      <span className="text-xs text-white/40">
                        {STATUS_LABEL[row.status] ?? row.status}
                        {" · "}
                        {formatDate(row.created_at)}
                      </span>
                    </div>

                    <Link
                      href={`/media/${row.media.id}`}
                      className="mt-1 block font-medium leading-tight hover:underline"
                    >
                      {row.media.title}
                    </Link>
                    <p className="text-sm text-white/50">
                      {row.media.creator ?? ""}
                      {row.media.creator && row.media.release_year ? " · " : ""}
                      {row.media.release_year ?? ""}
                    </p>

                    {row.rating ? (
                      <p className="mt-1 text-sm text-[#f5d56b]">
                        {starsFromRating(row.rating)}
                      </p>
                    ) : null}

                    {row.review ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">
                        {row.review}
                      </p>
                    ) : null}
                  </div>
                </li>
              ) : null,
            )}
          </ul>
        )}
      </div>
    </main>
  );
}
