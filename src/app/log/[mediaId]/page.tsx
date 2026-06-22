import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveLog } from "./actions";
import { addToList } from "@/app/lists/actions";
import { toggleFeatured } from "@/app/profile/actions";
import { RATING_OPTIONS } from "@/lib/stars";

// Status wording is phrased per medium (read / watch / listen / play / view).
const VERBS: Record<
  string,
  { planned: string; in_progress: string; completed: string }
> = {
  book: { planned: "Want to read", in_progress: "Reading", completed: "Read" },
  film: { planned: "Want to watch", in_progress: "Watching", completed: "Watched" },
  tv: { planned: "Want to watch", in_progress: "Watching", completed: "Watched" },
  music: { planned: "Want to listen", in_progress: "Listening", completed: "Listened" },
  game: { planned: "Want to play", in_progress: "Playing", completed: "Played" },
  art: { planned: "Want to see", in_progress: "Viewing", completed: "Seen" },
};

const MEDIA_COLOR: Record<string, string> = {
  book: "#4FBF7A",
  film: "#D94F4F",
  tv: "#4F7ED9",
  music: "#D94FB8",
  game: "#7A4FD9",
  art: "#BFA34F",
};

const SEARCH_PATH: Record<string, string> = {
  book: "/books",
  film: "/films",
  tv: "/tv",
  music: "/music",
  game: "/games",
  art: "/art",
};

function statusOptions(mediaType: string) {
  const v = VERBS[mediaType] ?? VERBS.book;
  return [
    { value: "planned", label: v.planned },
    { value: "in_progress", label: v.in_progress },
    { value: "completed", label: v.completed },
    { value: "on_hold", label: "On hold" },
    { value: "dropped", label: "Dropped" },
  ];
}

export default async function LogPage({
  params,
  searchParams,
}: {
  params: Promise<{ mediaId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { mediaId } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: media } = await supabase
    .from("media_items")
    .select("id, title, creator, release_year, cover_url, media_type")
    .eq("id", mediaId)
    .single();

  if (!media) {
    notFound();
  }

  const STATUS_OPTIONS = statusOptions(media.media_type);

  // Pre-fill if the user already has a log for this item.
  const { data: existing } = await supabase
    .from("logs")
    .select("status, rating, review, contains_spoilers, consumed_on")
    .eq("user_id", user.id)
    .eq("media_id", mediaId)
    .maybeSingle();

  // The user's lists, for the "Add to list" control.
  const { data: myLists } = await supabase
    .from("lists")
    .select("id, title")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Is this item featured on the user's profile?
  const { data: me } = await supabase
    .from("profiles")
    .select("featured_media")
    .eq("id", user.id)
    .single();
  const isFeatured = ((me?.featured_media as string[]) ?? []).includes(mediaId);

  return (
    <main className="min-h-screen bg-[#15130f] text-[#f5f3ee] p-8">
      <div className="mx-auto max-w-lg">
        <Link
          href={SEARCH_PATH[media.media_type] ?? "/"}
          className="text-sm text-white/50 hover:text-white/80"
        >
          ← Back to search
        </Link>

        <div className="mt-4 flex gap-4">
          <div className="flex w-20 shrink-0 overflow-hidden rounded border border-white/10">
            <div
              className="w-1 shrink-0"
              style={{ background: MEDIA_COLOR[media.media_type] ?? "#888" }}
            />
            <div className="aspect-[2/3] flex-1 bg-black/30">
              {media.cover_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={media.cover_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          </div>
          <div>
            <h1 className="text-xl font-semibold leading-tight tracking-tight">
              {media.title}
            </h1>
            <p className="text-sm text-white/50">
              {media.creator ?? ""}
              {media.creator && media.release_year ? " · " : ""}
              {media.release_year ?? ""}
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded bg-[#D94F4F]/15 border border-[#D94F4F]/30 p-3 text-sm text-[#eaa]">
            {error}
          </p>
        )}

        <form action={saveLog} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="media_id" value={media.id} />

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/70">Status</span>
            <select
              name="status"
              defaultValue={existing?.status ?? "completed"}
              className="rounded border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/70">Rating</span>
            <select
              name="rating"
              defaultValue={existing?.rating?.toString() ?? ""}
              className="rounded border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40"
            >
              <option value="">No rating</option>
              {RATING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/70">Review (optional)</span>
            <textarea
              name="review"
              rows={4}
              defaultValue={existing?.review ?? ""}
              placeholder="What did you think?"
              className="rounded border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40 resize-y"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              name="contains_spoilers"
              defaultChecked={existing?.contains_spoilers ?? false}
            />
            This review contains spoilers
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/70">Date finished (optional)</span>
            <input
              type="date"
              name="consumed_on"
              defaultValue={existing?.consumed_on ?? ""}
              className="rounded border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40"
            />
          </label>

          <div className="mt-2 flex items-center gap-3">
            <button className="self-start rounded bg-[#f5f3ee] px-4 py-2 text-sm font-medium text-[#15130f] hover:bg-white">
              {existing ? "Update log" : "Save to shelf"}
            </button>
          </div>
        </form>

        {/* Feature on profile */}
        <form action={toggleFeatured} className="mt-4">
          <input type="hidden" name="media_id" value={media.id} />
          <input type="hidden" name="redirect_to" value={`/log/${media.id}`} />
          <button className="rounded border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/5">
            {isFeatured ? "★ Featured on profile — remove" : "☆ Feature on profile"}
          </button>
        </form>

        {/* Add to a list */}
        <div className="mt-8 border-t border-white/10 pt-6">
          <h2 className="text-sm font-medium uppercase tracking-wide text-white/40">
            Add to a list
          </h2>
          {myLists && myLists.length > 0 ? (
            <form action={addToList} className="mt-3 flex flex-wrap items-center gap-3">
              <input type="hidden" name="media_id" value={media.id} />
              <input
                type="hidden"
                name="redirect_to"
                value={`/log/${media.id}`}
              />
              <select
                name="list_id"
                className="rounded border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40"
              >
                {myLists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
              <button className="rounded border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/5">
                Add
              </button>
            </form>
          ) : (
            <p className="mt-3 text-sm text-white/50">
              You have no lists yet.{" "}
              <Link href="/lists" className="underline">
                Create one
              </Link>
              , then come back to add this.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
