import { searchTv, type ScreenResult } from "@/lib/tmdb";
import { openMedia, startLog } from "../media-actions";
import { SearchTabs } from "../_components/SearchTabs";
import { BackButton } from "@/app/_components/BackButton";

const TV_COLOR = "#4F7ED9"; // the fixed accent colour for TV

export default async function TvPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string }>;
}) {
  const { q, error: pageError } = await searchParams;
  const query = (q ?? "").trim();

  let results: ScreenResult[] = [];
  let error: string | null = pageError ?? null;

  if (query) {
    try {
      results = await searchTv(query);
    } catch (e) {
      error =
        e instanceof Error && e.message.includes("TMDB_READ_TOKEN")
          ? "TMDb isn't set up yet — the API token is missing."
          : "Couldn't reach TMDb just now. Please try again.";
    }
  }

  return (
    <main className="min-h-screen text-[#e8c58f] px-4 py-8 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Search TV shows
          </h1>
          <BackButton className="text-sm text-white/50 hover:text-white/80" />
        </div>

        <form method="get" className="mt-6 flex gap-3">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="TV show title…"
            className="flex-1 rounded border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40"
          />
          <button className="rounded bg-[#e8c58f] px-4 py-2 text-sm font-medium text-[#200f0a] hover:bg-white">
            Search
          </button>
        </form>

        <SearchTabs active="tv" q={query} />

        {error && (
          <p className="mt-6 rounded bg-[#D94F4F]/15 border border-[#D94F4F]/30 p-3 text-sm text-[#eaa]">
            {error}
          </p>
        )}

        {query && !error && results.length === 0 && (
          <p className="mt-6 text-sm text-white/50">
            No TV shows found for “{query}”.
          </p>
        )}

        {results.length > 0 && (
          <ul className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {results.map((show) => (
              <li key={show.sourceId}>
                <div className="tile flex overflow-hidden rounded border border-white/10">
                  <div
                    className="w-1 shrink-0"
                    style={{ background: TV_COLOR }}
                  />
                  <div className="relative aspect-[2/3] flex-1 bg-black/30">
                    {show.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={show.coverUrl}
                        alt={`Poster of ${show.title}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-white/80"
                        style={{
                          background: `linear-gradient(160deg, ${TV_COLOR}33, #200f0a)`,
                        }}
                      >
                        {show.title}
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-medium leading-tight">
                  {show.title}
                </p>
                <p className="text-xs text-white/50">{show.year ?? "—"}</p>
                <form action={openMedia} className="mt-2 flex gap-2">
                  <input type="hidden" name="media_type" value="tv" />
                  <input type="hidden" name="source" value="tmdb" />
                  <input type="hidden" name="source_id" value={show.sourceId} />
                  <input type="hidden" name="title" value={show.title} />
                  <input
                    type="hidden"
                    name="release_year"
                    value={show.year ?? ""}
                  />
                  <input
                    type="hidden"
                    name="cover_url"
                    value={show.coverUrl ?? ""}
                  />
                  <input
                    type="hidden"
                    name="description"
                    value={show.description ?? ""}
                  />
                  <button className="flex-1 rounded bg-[#e8c58f] px-2 py-1.5 text-xs font-medium text-[#200f0a] hover:bg-white">
                    View
                  </button>
                  <button
                    formAction={startLog}
                    className="flex-1 rounded border border-white/20 px-2 py-1.5 text-xs font-medium hover:bg-white/5"
                  >
                    Log
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
