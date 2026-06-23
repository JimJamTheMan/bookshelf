import { dedupeBy } from "./dedupe";
import type { MediaDetails } from "./media-details";

// TMDb search for films and TV — called server-side only. Uses the v4 "API Read
// Access Token" as a Bearer secret (TMDB_READ_TOKEN, never exposed to the browser).

export type ScreenResult = {
  sourceId: string; // TMDb numeric id, as a string
  title: string;
  year: number | null;
  coverUrl: string | null;
  description: string | null;
};

const IMG_BASE = "https://image.tmdb.org/t/p/w342";

function yearFrom(date: string | undefined): number | null {
  if (!date) return null;
  const y = Number.parseInt(date.slice(0, 4), 10);
  return Number.isFinite(y) ? y : null;
}

async function tmdb(path: string, query: string) {
  const token = process.env.TMDB_READ_TOKEN;
  if (!token || token.startsWith("PASTE_")) {
    throw new Error("TMDB_READ_TOKEN is not set");
  }

  const url = new URL(`https://api.themoviedb.org/3${path}`);
  url.searchParams.set("query", query);
  url.searchParams.set("include_adult", "false");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`TMDb error: ${res.status}`);
  return res.json();
}

export async function searchMovies(query: string): Promise<ScreenResult[]> {
  const data = (await tmdb("/search/movie", query)) as {
    results?: Array<{
      id: number;
      title?: string;
      release_date?: string;
      poster_path?: string | null;
      overview?: string;
    }>;
  };
  const results = (data.results ?? []).map((m) => ({
    sourceId: String(m.id),
    title: m.title ?? "Untitled",
    year: yearFrom(m.release_date),
    coverUrl: m.poster_path ? `${IMG_BASE}${m.poster_path}` : null,
    description: m.overview || null,
  }));

  return dedupeBy(results, (m) => `${m.title}|${m.year ?? ""}`);
}

export async function searchTv(query: string): Promise<ScreenResult[]> {
  const data = (await tmdb("/search/tv", query)) as {
    results?: Array<{
      id: number;
      name?: string;
      first_air_date?: string;
      poster_path?: string | null;
      overview?: string;
    }>;
  };
  const results = (data.results ?? []).map((t) => ({
    sourceId: String(t.id),
    title: t.name ?? "Untitled",
    year: yearFrom(t.first_air_date),
    coverUrl: t.poster_path ? `${IMG_BASE}${t.poster_path}` : null,
    description: t.overview || null,
  }));

  return dedupeBy(results, (t) => `${t.title}|${t.year ?? ""}`);
}

// Full details for one film or TV show (with credits).
export async function getScreenDetails(
  mediaType: string,
  id: string,
): Promise<MediaDetails | null> {
  const token = process.env.TMDB_READ_TOKEN;
  if (!token || token.startsWith("PASTE_")) return null;

  const isTv = mediaType === "tv";
  const url = `https://api.themoviedb.org/3/${isTv ? "tv" : "movie"}/${id}?append_to_response=credits`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;

  const d = (await res.json()) as {
    overview?: string;
    genres?: { name: string }[];
    runtime?: number;
    episode_run_time?: number[];
    number_of_seasons?: number;
    created_by?: { name: string }[];
    vote_average?: number;
    credits?: {
      crew?: { job: string; name: string }[];
      cast?: { name: string }[];
    };
  };

  const facts: { label: string; value: string }[] = [];
  const genres = (d.genres ?? []).map((g) => g.name).join(", ");
  if (genres) facts.push({ label: "Genres", value: genres });

  if (isTv) {
    if (d.number_of_seasons)
      facts.push({ label: "Seasons", value: String(d.number_of_seasons) });
    const creators = (d.created_by ?? []).map((c) => c.name).join(", ");
    if (creators) facts.push({ label: "Creator", value: creators });
    if (d.episode_run_time?.[0])
      facts.push({ label: "Episode length", value: `${d.episode_run_time[0]} min` });
  } else {
    if (d.runtime) facts.push({ label: "Runtime", value: `${d.runtime} min` });
    const director = (d.credits?.crew ?? []).find((c) => c.job === "Director")?.name;
    if (director) facts.push({ label: "Director", value: director });
  }

  const cast = (d.credits?.cast ?? []).slice(0, 4).map((c) => c.name).join(", ");
  if (cast) facts.push({ label: "Starring", value: cast });
  if (d.vote_average)
    facts.push({ label: "TMDb score", value: `${d.vote_average.toFixed(1)}/10` });

  return { description: d.overview || null, facts };
}
