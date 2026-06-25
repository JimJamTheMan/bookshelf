import { searchBooks } from "./openlibrary";
import { searchMovies, searchTv } from "./tmdb";
import { searchGames } from "./igdb";
import { searchMusic } from "./musicbrainz";
import { searchArt } from "./wikimedia";

// One normalised shape for a search result from any vendor.
export type SearchHit = {
  mediaType: string;
  source: string;
  sourceId: string;
  title: string;
  creator: string | null;
  year: number | null;
  coverUrl: string | null;
};

const PER_TYPE = 12;

function settled<T>(r: PromiseSettledResult<T[]>): T[] {
  return r.status === "fulfilled" ? r.value : [];
}

// Search every vendor in parallel and return a combined, type-tagged list.
// A vendor that errors is simply skipped (so one outage can't break search).
export async function searchAllMedia(query: string): Promise<SearchHit[]> {
  const [books, films, tv, games, music, art] = await Promise.allSettled([
    searchBooks(query),
    searchMovies(query),
    searchTv(query),
    searchGames(query),
    searchMusic(query),
    searchArt(query),
  ]);

  const hits: SearchHit[] = [];

  for (const b of settled(books).slice(0, PER_TYPE))
    hits.push({ mediaType: "book", source: "open_library", sourceId: b.sourceId, title: b.title, creator: b.author, year: b.year, coverUrl: b.coverUrl });
  for (const m of settled(films).slice(0, PER_TYPE))
    hits.push({ mediaType: "film", source: "tmdb", sourceId: m.sourceId, title: m.title, creator: null, year: m.year, coverUrl: m.coverUrl });
  for (const m of settled(tv).slice(0, PER_TYPE))
    hits.push({ mediaType: "tv", source: "tmdb", sourceId: m.sourceId, title: m.title, creator: null, year: m.year, coverUrl: m.coverUrl });
  for (const g of settled(games).slice(0, PER_TYPE))
    hits.push({ mediaType: "game", source: "igdb", sourceId: g.sourceId, title: g.title, creator: null, year: g.year, coverUrl: g.coverUrl });
  for (const m of settled(music).slice(0, PER_TYPE))
    hits.push({ mediaType: "music", source: "musicbrainz", sourceId: m.sourceId, title: m.title, creator: m.artist, year: m.year, coverUrl: m.coverUrl });
  for (const a of settled(art).slice(0, PER_TYPE))
    hits.push({ mediaType: "art", source: "wikimedia", sourceId: a.sourceId, title: a.title, creator: a.artist, year: null, coverUrl: a.coverUrl });

  return hits;
}
