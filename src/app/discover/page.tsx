import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Cover } from "../_components/Cover";
import { coverAspect, displayTitle } from "@/lib/format";
import { getTrending } from "@/lib/tmdb";
import { getRecommendations } from "@/lib/recommendations";
import { searchAllMedia } from "@/lib/search-all";
import { VendorResults } from "../_components/VendorResults";
import { TrendingFeed } from "./TrendingFeed";

const MEDIA_COLOR: Record<string, string> = {
  book: "#4FBF7A", film: "#D94F4F", tv: "#4F7ED9",
  music: "#D94FB8", game: "#7A4FD9", art: "#BFA34F",
};

type Media = {
  id: string;
  title: string;
  creator: string | null;
  release_year: number | null;
  cover_url: string | null;
  media_type: string;
};

type Person = {
  id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
};

// Grid of already-catalogued items (link straight to their detail page).
function MediaGrid({ items }: { items: Media[] }) {
  return (
    <ul className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map((m) => (
        <li key={m.id}>
          <Link href={`/media/${m.id}`}>
            <div className="flex overflow-hidden rounded border border-white/10">
              <div className="w-1 shrink-0" style={{ background: MEDIA_COLOR[m.media_type] ?? "#888" }} />
              <div className={`${coverAspect(m.media_type)} flex-1 bg-black/30`}>
                <Cover src={m.cover_url} title={m.title} color={MEDIA_COLOR[m.media_type] ?? "#888"} />
              </div>
            </div>
          </Link>
          <p className="mt-2 line-clamp-2 text-sm font-medium leading-tight">
            {displayTitle(m.title, m.release_year, m.media_type)}
          </p>
          <p className="text-xs text-white/50">{m.creator ?? ""}</p>
        </li>
      ))}
    </ul>
  );
}

function PeopleList({ people }: { people: Person[] }) {
  return (
    <ul className="mt-4 flex flex-col gap-2">
      {people.map((p) => (
        <li key={p.id}>
          <Link
            href={`/u/${p.handle}`}
            className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-3 hover:border-white/30"
          >
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/10">
              {p.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">{p.display_name || p.handle}</p>
              <p className="text-xs text-white/40">@{p.handle}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function DiscoverPage({
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

  if (query) {
    // Search every vendor (films, TV, games, music, books, art) + people.
    const [hits, { data: peopleData }] = await Promise.all([
      searchAllMedia(query),
      supabase
        .from("profiles")
        .select("id, handle, display_name, avatar_url")
        .or(`handle.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(20),
    ]);
    const people = (peopleData ?? []) as Person[];

    return (
      <DiscoverShell query={query}>
        {people.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-medium uppercase tracking-wide text-white/40">
              People
            </h2>
            <PeopleList people={people} />
          </section>
        )}
        <VendorResults hits={hits} />
      </DiscoverShell>
    );
  }

  // Browse: trending + personalised + people to follow.
  const trending = await getTrending();
  const recs = user
    ? await getRecommendations(supabase, user.id)
    : { byCreators: [], tasteMatches: [] };
  const forYou = [...recs.byCreators, ...recs.tasteMatches].slice(0, 12);

  const { data: peopleData } = await supabase
    .from("profiles")
    .select("id, handle, display_name, avatar_url")
    .order("created_at", { ascending: false })
    .limit(12);
  const people = (peopleData ?? []) as Person[];

  return (
    <DiscoverShell query="">
      {forYou.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-medium uppercase tracking-wide text-white/40">
            For you
          </h2>
          <MediaGrid items={forYou} />
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide text-white/40">
          People to follow
        </h2>
        {people.length > 0 ? (
          <PeopleList people={people} />
        ) : (
          <p className="mt-3 text-sm text-white/50">No people yet.</p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium uppercase tracking-wide text-white/40">
          Popular this week
        </h2>
        {trending.length > 0 ? (
          <TrendingFeed initial={trending} />
        ) : (
          <p className="mt-3 text-sm text-white/50">
            Couldn&apos;t load trending right now.
          </p>
        )}
      </section>
    </DiscoverShell>
  );
}

function DiscoverShell({
  query,
  children,
}: {
  query: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#200f0a] text-[#e8c58f] px-4 py-8 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Discover</h1>
          <Link href="/" className="text-sm text-white/50 hover:text-white/80">
            ← Home
          </Link>
        </div>

        <form method="get" className="mt-6 flex gap-3">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search the catalogue and people…"
            className="flex-1 rounded border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40"
          />
          <button className="rounded bg-[#e8c58f] px-4 py-2 text-sm font-medium text-[#200f0a] hover:bg-white">
            Search
          </button>
        </form>

        {children}
      </div>
    </main>
  );
}
