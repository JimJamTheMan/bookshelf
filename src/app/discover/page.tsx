import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Cover } from "../_components/Cover";

const MEDIA_COLOR: Record<string, string> = {
  book: "#4FBF7A", film: "#D94F4F", tv: "#4F7ED9",
  music: "#D94FB8", game: "#7A4FD9", art: "#BFA34F",
};

type Media = {
  id: string;
  title: string;
  creator: string | null;
  cover_url: string | null;
  media_type: string;
};

type Person = {
  id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
};

function MediaGrid({ items }: { items: Media[] }) {
  return (
    <ul className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map((m) => (
        <li key={m.id}>
          <Link href={`/media/${m.id}`}>
            <div className="flex overflow-hidden rounded border border-white/10">
              <div
                className="w-1 shrink-0"
                style={{ background: MEDIA_COLOR[m.media_type] ?? "#888" }}
              />
              <div className="aspect-[2/3] flex-1 bg-black/30">
                <Cover
                  src={m.cover_url}
                  title={m.title}
                  color={MEDIA_COLOR[m.media_type] ?? "#888"}
                />
              </div>
            </div>
          </Link>
          <p className="mt-2 line-clamp-2 text-sm font-medium leading-tight">
            {m.title}
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
                <img
                  src={p.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">
                {p.display_name || p.handle}
              </p>
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

  let media: Media[] = [];
  let people: Person[] = [];

  if (query) {
    const { data: mediaData } = await supabase.rpc("search_media", {
      p_query: query,
    });
    media = (mediaData ?? []) as Media[];

    const { data: peopleData } = await supabase
      .from("profiles")
      .select("id, handle, display_name, avatar_url")
      .or(`handle.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(20);
    people = (peopleData ?? []) as Person[];
  } else {
    // Browse: most recently catalogued media + some people.
    const { data: mediaData } = await supabase
      .from("media_items")
      .select("id, title, creator, cover_url, media_type")
      .order("created_at", { ascending: false })
      .limit(18);
    media = (mediaData ?? []) as Media[];

    const { data: peopleData } = await supabase
      .from("profiles")
      .select("id, handle, display_name, avatar_url")
      .order("created_at", { ascending: false })
      .limit(12);
    people = (peopleData ?? []) as Person[];
  }

  return (
    <main className="min-h-screen bg-[#15130f] text-[#f5f3ee] p-8">
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
          <button className="rounded bg-[#f5f3ee] px-4 py-2 text-sm font-medium text-[#15130f] hover:bg-white">
            Search
          </button>
        </form>

        <section className="mt-8">
          <h2 className="text-sm font-medium uppercase tracking-wide text-white/40">
            {query ? "People" : "People to follow"}
          </h2>
          {people.length > 0 ? (
            <PeopleList people={people} />
          ) : (
            <p className="mt-3 text-sm text-white/50">No people found.</p>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-sm font-medium uppercase tracking-wide text-white/40">
            {query ? "Media" : "Recently added to the catalogue"}
          </h2>
          {media.length > 0 ? (
            <MediaGrid items={media} />
          ) : (
            <p className="mt-3 text-sm text-white/50">
              {query
                ? "No catalogued media matches — try logging it from a Search page first."
                : "Nothing in the catalogue yet."}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
