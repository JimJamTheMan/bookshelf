import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Cover } from "../../_components/Cover";
import { starsFromRating } from "@/lib/stars";
import { statusLabel } from "@/lib/status";
import { coverAspect, displayTitle } from "@/lib/format";
import { follow, unfollow } from "./actions";

const MEDIA_COLOR: Record<string, string> = {
  book: "#4FBF7A", film: "#D94F4F", tv: "#4F7ED9",
  music: "#D94FB8", game: "#7A4FD9", art: "#BFA34F",
};

type FeaturedItem = {
  id: string;
  title: string;
  cover_url: string | null;
  media_type: string;
};

type ShelfRow = {
  status: string;
  rating: number | null;
  media: {
    id: string;
    title: string;
    release_year: number | null;
    cover_url: string | null;
    media_type: string;
  } | null;
};

// Public, read-only view of any user's profile by their handle.
export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, handle, display_name, bio, avatar_url, banner_url, accent_color, featured_media, follower_count, following_count",
    )
    .eq("handle", handle.toLowerCase())
    .single();

  if (!profile) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isSelf = user?.id === profile.id;

  // Is the logged-in user already following this profile?
  let isFollowing = false;
  if (user && !isSelf) {
    const { data: existing } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", user.id)
      .eq("followee_id", profile.id)
      .maybeSingle();
    isFollowing = !!existing;
  }

  const accent = profile.accent_color || "#D94F4F";

  // Featured media (preserve the order stored in the array).
  const featuredIds = (profile.featured_media as string[]) ?? [];
  let featured: FeaturedItem[] = [];
  if (featuredIds.length > 0) {
    const { data: fm } = await supabase
      .from("media_items")
      .select("id, title, cover_url, media_type")
      .in("id", featuredIds);
    const byId = new Map((fm ?? []).map((m) => [m.id, m as FeaturedItem]));
    featured = featuredIds
      .map((id) => byId.get(id))
      .filter((m): m is FeaturedItem => !!m);
  }

  // This user's lists, shown on their profile (public ones for everyone; the
  // owner also sees their unlisted/private ones via RLS).
  let listsQuery = supabase
    .from("lists")
    .select("id, title, visibility, item_count")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });
  // Visitors only see public lists; the owner sees all of their own.
  if (!isSelf) listsQuery = listsQuery.eq("visibility", "public");
  const { data: listsData } = await listsQuery;
  const profileLists = (listsData ?? []) as {
    id: string;
    title: string;
    visibility: string;
    item_count: number | null;
  }[];

  // This user's shelf — everything they've logged, newest first.
  const { data: shelfData } = await supabase
    .from("logs")
    .select(
      "status, rating, media:media_items(id, title, release_year, cover_url, media_type)",
    )
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(24);
  const shelf = (shelfData ?? []) as unknown as ShelfRow[];

  return (
    <main className="min-h-screen bg-[#200f0a] text-[#e8c58f] flex items-center justify-center p-8">
      <div className="w-full max-w-lg overflow-hidden rounded-lg border border-white/10 bg-black/20">
        {/* Banner */}
        <div
          className="relative h-28 w-full"
          style={
            profile.banner_url
              ? undefined
              : { background: `linear-gradient(135deg, ${accent}66, #200f0a)` }
          }
        >
          {profile.banner_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.banner_url}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
          <Link
            href="/"
            className="absolute left-3 top-3 rounded bg-black/40 px-2 py-1 text-xs text-white/80 hover:bg-black/60"
          >
            ← Home
          </Link>
        </div>

        <div className="relative z-10 px-6 pb-6">
          {/* Avatar overlaps the banner; everything else sits below it */}
          <div className="-mt-12">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                className="h-20 w-20 rounded-full object-cover border-4"
                style={{ borderColor: "#200f0a", boxShadow: `0 0 0 2px ${accent}` }}
              />
            ) : (
              <div
                className="h-20 w-20 rounded-full border-4"
                style={{ background: accent, borderColor: "#200f0a" }}
              />
            )}
          </div>

          <div className="mt-3 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight">
                {profile.display_name || profile.handle}
              </h1>
              <p className="text-sm text-white/50">@{profile.handle}</p>
            </div>

            {user && !isSelf && (
              <form action={isFollowing ? unfollow : follow} className="shrink-0">
                <input type="hidden" name="followee_id" value={profile.id} />
                <input type="hidden" name="handle" value={profile.handle} />
                <button
                  className={
                    isFollowing
                      ? "rounded border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/5"
                      : "rounded bg-[#e8c58f] px-4 py-2 text-sm font-medium text-[#200f0a] hover:bg-white"
                  }
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </form>
            )}
            {isSelf && (
              <Link
                href="/profile"
                className="shrink-0 rounded border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/5"
              >
                Edit profile
              </Link>
            )}
          </div>

        {profile.bio && (
          <p className="mt-4 text-sm text-white/80 whitespace-pre-wrap">
            {profile.bio}
          </p>
        )}

        <div className="mt-6 flex gap-6 text-sm text-white/60">
          <span>
            <span className="text-white/90">{profile.follower_count ?? 0}</span>{" "}
            followers
          </span>
          <span>
            <span className="text-white/90">{profile.following_count ?? 0}</span>{" "}
            following
          </span>
        </div>

        {shelf.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xs font-medium uppercase tracking-wide text-white/40">
              Shelf
            </h2>
            <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {shelf.map((row, i) =>
                row.media ? (
                  <li key={`${row.media.id}-${i}`}>
                    <Link href={`/media/${row.media.id}`}>
                      <div className="flex overflow-hidden rounded border border-white/10">
                        <div
                          className="w-1 shrink-0"
                          style={{
                            background:
                              MEDIA_COLOR[row.media.media_type] ?? "#888",
                          }}
                        />
                        <div className={`${coverAspect(row.media.media_type)} flex-1 bg-black/30`}>
                          <Cover
                            src={row.media.cover_url}
                            title={row.media.title}
                            color={MEDIA_COLOR[row.media.media_type] ?? "#888"}
                          />
                        </div>
                      </div>
                    </Link>
                    <p className="mt-1 line-clamp-1 text-xs font-medium leading-tight">
                      {displayTitle(
                        row.media.title,
                        row.media.release_year,
                        row.media.media_type,
                      )}
                    </p>
                    <p className="text-[11px] text-white/40">
                      {statusLabel(row.media.media_type, row.status)}
                      {row.rating ? ` · ${starsFromRating(row.rating)}` : ""}
                    </p>
                  </li>
                ) : null,
              )}
            </ul>
          </div>
        )}

        {featured.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xs font-medium uppercase tracking-wide text-white/40">
              Featured
            </h2>
            <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {featured.map((m) => (
                <li key={m.id}>
                  <Link href={`/media/${m.id}`}>
                    <div className="flex overflow-hidden rounded border border-white/10">
                      <div
                        className="w-1 shrink-0"
                        style={{ background: MEDIA_COLOR[m.media_type] ?? "#888" }}
                      />
                      <div className={`${coverAspect(m.media_type)} flex-1 bg-black/30`}>
                        <Cover
                          src={m.cover_url}
                          title={m.title}
                          color={MEDIA_COLOR[m.media_type] ?? "#888"}
                        />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {profileLists.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xs font-medium uppercase tracking-wide text-white/40">
              Lists
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {profileLists.map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/lists/${l.id}`}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm hover:border-white/30"
                  >
                    <span className="font-medium">{l.title}</span>
                    <span className="text-xs text-white/40">
                      {isSelf && l.visibility !== "public"
                        ? `${l.visibility} · `
                        : ""}
                      {l.item_count ?? 0} items
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        </div>
      </div>
    </main>
  );
}
