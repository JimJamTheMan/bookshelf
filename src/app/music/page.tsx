import Link from "next/link";
import { searchMusic, type MusicResult } from "@/lib/musicbrainz";
import { openMedia, startLog } from "../media-actions";
import { SearchTabs } from "../_components/SearchTabs";
import { Cover } from "../_components/Cover";

const MUSIC_COLOR = "#D94FB8"; // the fixed accent colour for music

export default async function MusicPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string }>;
}) {
  const { q, error: pageError } = await searchParams;
  const query = (q ?? "").trim();

  let results: MusicResult[] = [];
  let error: string | null = pageError ?? null;

  if (query) {
    try {
      results = await searchMusic(query);
    } catch {
      error = "Couldn't reach MusicBrainz just now. Please try again.";
    }
  }

  return (
    <main className="min-h-screen text-[#e8c58f] px-4 py-8 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Search music
          </h1>
          <Link href="/" className="text-sm text-white/50 hover:text-white/80">
            ← Home
          </Link>
        </div>

        <form method="get" className="mt-6 flex gap-3">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Album or artist…"
            className="flex-1 rounded border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40"
          />
          <button className="rounded bg-[#e8c58f] px-4 py-2 text-sm font-medium text-[#200f0a] hover:bg-white">
            Search
          </button>
        </form>

        <SearchTabs active="music" q={query} />

        {error && (
          <p className="mt-6 rounded bg-[#D94F4F]/15 border border-[#D94F4F]/30 p-3 text-sm text-[#eaa]">
            {error}
          </p>
        )}

        {query && !error && results.length === 0 && (
          <p className="mt-6 text-sm text-white/50">
            No music found for “{query}”.
          </p>
        )}

        {results.length > 0 && (
          <ul className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {results.map((album) => (
              <li key={album.sourceId}>
                <div className="tile flex overflow-hidden rounded border border-white/10">
                  <div
                    className="w-1 shrink-0"
                    style={{ background: MUSIC_COLOR }}
                  />
                  <div className="relative aspect-square flex-1 bg-black/30">
                    <Cover
                      src={album.coverUrl}
                      title={album.title}
                      color={MUSIC_COLOR}
                    />
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-medium leading-tight">
                  {album.title}
                </p>
                <p className="text-xs text-white/50">
                  {album.artist ?? "Unknown artist"}
                  {album.year ? ` · ${album.year}` : ""}
                </p>
                <form action={openMedia} className="mt-2 flex gap-2">
                  <input type="hidden" name="media_type" value="music" />
                  <input type="hidden" name="source" value="musicbrainz" />
                  <input type="hidden" name="source_id" value={album.sourceId} />
                  <input type="hidden" name="title" value={album.title} />
                  <input
                    type="hidden"
                    name="creator"
                    value={album.artist ?? ""}
                  />
                  <input
                    type="hidden"
                    name="release_year"
                    value={album.year ?? ""}
                  />
                  <input
                    type="hidden"
                    name="cover_url"
                    value={album.coverUrl ?? ""}
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
