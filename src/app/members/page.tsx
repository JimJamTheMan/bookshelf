import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { follow, unfollow } from "../u/[handle]/actions";

type Member = {
  id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  follower_count: number | null;
};

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let qb = supabase
    .from("profiles")
    .select("id, handle, display_name, avatar_url, bio, follower_count")
    .order("follower_count", { ascending: false })
    .limit(60);
  if (query) {
    qb = qb.or(`handle.ilike.%${query}%,display_name.ilike.%${query}%`);
  }
  const { data } = await qb;
  let people = (data ?? []) as Member[];
  if (user) people = people.filter((p) => p.id !== user.id);

  // Which of these am I already following?
  let following = new Set<string>();
  if (user && people.length > 0) {
    const { data: f } = await supabase
      .from("follows")
      .select("followee_id")
      .eq("follower_id", user.id)
      .in(
        "followee_id",
        people.map((p) => p.id),
      );
    following = new Set((f ?? []).map((r) => r.followee_id));
  }

  return (
    <main className="min-h-screen bg-[#200f0a] text-[#e8c58f] px-4 py-8 sm:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
          <Link href="/" className="text-sm text-white/50 hover:text-white/80">
            ← Home
          </Link>
        </div>
        <p className="mt-1 text-sm text-white/50">
          Find and follow other people to fill your feed.
        </p>

        <form method="get" className="mt-6 flex gap-3">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search people by name or @handle…"
            className="flex-1 rounded border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40"
          />
          <button className="rounded bg-[#e8c58f] px-4 py-2 text-sm font-medium text-[#200f0a] hover:bg-white">
            Search
          </button>
          {query && (
            <Link
              href="/members"
              className="rounded border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/5"
            >
              Clear
            </Link>
          )}
        </form>

        {people.length === 0 ? (
          <p className="mt-10 text-center text-sm text-white/50">
            {query ? `No members match “${query}”.` : "No members yet."}
          </p>
        ) : (
          <ul className="mt-8 flex flex-col gap-2">
            {people.map((p) => {
              const isFollowing = following.has(p.id);
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-3"
                >
                  <Link href={`/u/${p.handle}`} className="shrink-0">
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.avatar_url}
                        alt=""
                        className="h-11 w-11 rounded-full border border-white/15 object-cover"
                      />
                    ) : (
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d26a2a] text-base font-bold text-[#200f0a]">
                        {(p.display_name || p.handle).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </Link>
                  <Link href={`/u/${p.handle}`} className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {p.display_name || p.handle}
                    </p>
                    <p className="truncate text-xs text-white/40">
                      @{p.handle} · {p.follower_count ?? 0} followers
                    </p>
                    {p.bio && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-white/50">
                        {p.bio}
                      </p>
                    )}
                  </Link>
                  {user && (
                    <form
                      action={isFollowing ? unfollow : follow}
                      className="shrink-0"
                    >
                      <input type="hidden" name="followee_id" value={p.id} />
                      <input type="hidden" name="handle" value={p.handle} />
                      <button
                        className={
                          isFollowing
                            ? "rounded border border-white/20 px-3 py-1.5 text-sm font-medium hover:bg-white/5"
                            : "rounded bg-[#d26a2a] px-3 py-1.5 text-sm font-medium text-[#200f0a] hover:opacity-90"
                        }
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
