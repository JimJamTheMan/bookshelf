import Link from "next/link";
import { searchGames, type GameResult } from "@/lib/igdb";
import { openMedia, startLog } from "../media-actions";

const GAME_COLOR = "#7A4FD9"; // the fixed accent colour for games

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string }>;
}) {
  const { q, error: pageError } = await searchParams;
  const query = (q ?? "").trim();

  let results: GameResult[] = [];
  let error: string | null = pageError ?? null;

  if (query) {
    try {
      results = await searchGames(query);
    } catch (e) {
      error =
        e instanceof Error && e.message.includes("TWITCH_CLIENT")
          ? "IGDB isn't set up yet — the Twitch credentials are missing."
          : "Couldn't reach IGDB just now. Please try again.";
    }
  }

  return (
    <main className="min-h-screen bg-[#200f0a] text-[#e8c58f] px-4 py-8 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Search games
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
            placeholder="Game title…"
            className="flex-1 rounded border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40"
          />
          <button className="rounded bg-[#e8c58f] px-4 py-2 text-sm font-medium text-[#200f0a] hover:bg-white">
            Search
          </button>
        </form>

        {error && (
          <p className="mt-6 rounded bg-[#D94F4F]/15 border border-[#D94F4F]/30 p-3 text-sm text-[#eaa]">
            {error}
          </p>
        )}

        {query && !error && results.length === 0 && (
          <p className="mt-6 text-sm text-white/50">
            No games found for “{query}”.
          </p>
        )}

        {results.length > 0 && (
          <ul className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {results.map((game) => (
              <li key={game.sourceId}>
                <div className="flex overflow-hidden rounded border border-white/10">
                  <div
                    className="w-1 shrink-0"
                    style={{ background: GAME_COLOR }}
                  />
                  <div className="relative aspect-[3/4] flex-1 bg-black/30">
                    {game.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={game.coverUrl}
                        alt={`Cover of ${game.title}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-white/80"
                        style={{
                          background: `linear-gradient(160deg, ${GAME_COLOR}33, #200f0a)`,
                        }}
                      >
                        {game.title}
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-medium leading-tight">
                  {game.title}
                </p>
                <p className="text-xs text-white/50">{game.year ?? "—"}</p>
                <form action={openMedia} className="mt-2 flex gap-2">
                  <input type="hidden" name="media_type" value="game" />
                  <input type="hidden" name="source" value="igdb" />
                  <input type="hidden" name="source_id" value={game.sourceId} />
                  <input type="hidden" name="title" value={game.title} />
                  <input
                    type="hidden"
                    name="release_year"
                    value={game.year ?? ""}
                  />
                  <input
                    type="hidden"
                    name="cover_url"
                    value={game.coverUrl ?? ""}
                  />
                  <input
                    type="hidden"
                    name="description"
                    value={game.description ?? ""}
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
