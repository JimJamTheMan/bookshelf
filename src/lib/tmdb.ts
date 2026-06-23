import { dedupeBy } from "./dedupe";
import type { MediaDetails } from "./media-details";
import type { Person, PersonWork } from "./people";

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

async function tmdbGet(path: string, params: Record<string, string>) {
  const token = process.env.TMDB_READ_TOKEN;
  if (!token || token.startsWith("PASTE_")) {
    throw new Error("TMDB_READ_TOKEN is not set");
  }

  const url = new URL(`https://api.themoviedb.org/3${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`TMDb error: ${res.status}`);
  return res.json();
}

type RawWork = {
  id: number;
  title?: string; // movie
  name?: string; // tv
  release_date?: string; // movie
  first_air_date?: string; // tv
  poster_path?: string | null;
  overview?: string;
  popularity?: number;
};

function toScreenResult(w: RawWork, kind: "movie" | "tv"): ScreenResult {
  return {
    sourceId: String(w.id),
    title: (kind === "movie" ? w.title : w.name) ?? "Untitled",
    year: yearFrom(kind === "movie" ? w.release_date : w.first_air_date),
    coverUrl: w.poster_path ? `${IMG_BASE}${w.poster_path}` : null,
    description: w.overview || null,
  };
}

// If the query looks like a person's name, return the films/shows they're
// involved in (as cast or crew — so actors AND directors are covered).
async function worksByPerson(
  query: string,
  kind: "movie" | "tv",
): Promise<RawWork[]> {
  try {
    const people = (await tmdbGet("/search/person", {
      query,
      include_adult: "false",
    })) as { results?: { id: number; name?: string }[] };

    const top = (people.results ?? [])[0];
    if (!top) return [];

    // Only treat it as a person search if the query really matches the name.
    const q = query.toLowerCase();
    const name = (top.name ?? "").toLowerCase();
    if (!name || (!name.includes(q) && !q.includes(name))) return [];

    const credits = (await tmdbGet(
      `/person/${top.id}/${kind === "movie" ? "movie_credits" : "tv_credits"}`,
      {},
    )) as { cast?: RawWork[]; crew?: RawWork[] };

    const seen = new Set<number>();
    const unique: RawWork[] = [];
    for (const w of [...(credits.cast ?? []), ...(credits.crew ?? [])].sort(
      (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0),
    )) {
      if (seen.has(w.id)) continue;
      seen.add(w.id);
      unique.push(w);
    }
    return unique.slice(0, 20);
  } catch {
    return [];
  }
}

async function searchScreen(
  query: string,
  kind: "movie" | "tv",
): Promise<ScreenResult[]> {
  const [byTitle, byPerson] = await Promise.all([
    tmdbGet(`/search/${kind}`, { query, include_adult: "false" }) as Promise<{
      results?: RawWork[];
    }>,
    worksByPerson(query, kind),
  ]);

  // Title matches first, then the person's works.
  const merged = [
    ...(byTitle.results ?? []).map((w) => toScreenResult(w, kind)),
    ...byPerson.map((w) => toScreenResult(w, kind)),
  ];

  const byId = dedupeBy(merged, (m) => m.sourceId);
  return dedupeBy(byId, (m) => `${m.title}|${m.year ?? ""}`).slice(0, 30);
}

export async function searchMovies(query: string): Promise<ScreenResult[]> {
  return searchScreen(query, "movie");
}

export async function searchTv(query: string): Promise<ScreenResult[]> {
  return searchScreen(query, "tv");
}

const BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280";

// Full details for one film or TV show (with credits + release dates for films).
export async function getScreenDetails(
  mediaType: string,
  id: string,
): Promise<MediaDetails | null> {
  const token = process.env.TMDB_READ_TOKEN;
  if (!token || token.startsWith("PASTE_")) return null;

  const isTv = mediaType === "tv";
  const append = isTv ? "credits" : "credits,release_dates";
  const url = `https://api.themoviedb.org/3/${isTv ? "tv" : "movie"}/${id}?append_to_response=${append}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;

  const d = (await res.json()) as {
    overview?: string;
    tagline?: string;
    backdrop_path?: string | null;
    genres?: { name: string }[];
    runtime?: number;
    episode_run_time?: number[];
    number_of_seasons?: number;
    created_by?: { name: string }[];
    vote_average?: number;
    credits?: {
      crew?: { id: number; job: string; name: string }[];
      cast?: { id: number; name: string; character?: string }[];
    };
    release_dates?: {
      results?: {
        iso_3166_1: string;
        release_dates?: {
          certification?: string;
          release_date?: string;
          type?: number;
        }[];
      }[];
    };
  };

  const facts: { label: string; value: string }[] = [];
  if (isTv) {
    if (d.number_of_seasons)
      facts.push({ label: "Seasons", value: String(d.number_of_seasons) });
    const creators = (d.created_by ?? []).map((c) => c.name).join(", ");
    if (creators) facts.push({ label: "Creator", value: creators });
    if (d.episode_run_time?.[0])
      facts.push({ label: "Episode length", value: `${d.episode_run_time[0]} min` });
  } else {
    if (d.runtime) facts.push({ label: "Runtime", value: `${d.runtime} min` });
  }
  if (d.vote_average)
    facts.push({ label: "TMDb score", value: `${d.vote_average.toFixed(1)}/10` });

  const cast = (d.credits?.cast ?? []).slice(0, 12).map((c) => ({
    id: c.id ?? null,
    name: c.name,
    character: c.character || null,
  }));

  // Key crew (directors + writers), linked to their person pages.
  const crewSeen = new Set<string>();
  const crew = (d.credits?.crew ?? [])
    .filter((c) => ["Director", "Writer", "Screenplay", "Creator"].includes(c.job))
    .filter((c) => {
      const key = `${c.id}-${c.job}`;
      if (crewSeen.has(key)) return false;
      crewSeen.add(key);
      return true;
    })
    .slice(0, 6)
    .map((c) => ({ id: c.id, name: c.name, job: c.job }));

  // Release dates by country (films): one primary date per country.
  const releases = (d.release_dates?.results ?? [])
    .map((r) => {
      const list = r.release_dates ?? [];
      const primary = list.find((x) => x.type === 3) ?? list[0]; // 3 = theatrical
      if (!primary?.release_date) return null;
      return {
        region: r.iso_3166_1,
        date: primary.release_date.slice(0, 10),
        cert: primary.certification || null,
      };
    })
    .filter((x): x is { region: string; date: string; cert: string | null } => !!x)
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    description: d.overview || null,
    facts,
    backdropUrl: d.backdrop_path ? `${BACKDROP_BASE}${d.backdrop_path}` : null,
    tagline: d.tagline || null,
    genres: (d.genres ?? []).map((g) => g.name),
    cast,
    crew,
    releases,
  };
}

// The person's Wikidata id (for cross-media linking), or null.
export async function getTmdbWikidataId(id: string): Promise<string | null> {
  try {
    const data = (await tmdbGet(`/person/${id}/external_ids`, {})) as {
      wikidata_id?: string | null;
    };
    return data.wikidata_id || null;
  } catch {
    return null;
  }
}

const PROFILE_BASE = "https://image.tmdb.org/t/p/w185";

// A person (actor/director/writer) and everything they're credited on.
export async function getTmdbPerson(id: string): Promise<Person | null> {
  const data = (await tmdbGet(`/person/${id}`, {
    append_to_response: "combined_credits",
  })) as {
    name?: string;
    biography?: string;
    profile_path?: string | null;
    known_for_department?: string;
    combined_credits?: {
      cast?: RawWork[];
      crew?: (RawWork & { job?: string })[];
    };
  };
  if (!data.name) return null;

  const credits = [
    ...(data.combined_credits?.cast ?? []),
    ...(data.combined_credits?.crew ?? []),
  ] as (RawWork & { media_type?: string; character?: string; job?: string })[];

  const seen = new Set<string>();
  const works: PersonWork[] = [];
  for (const w of credits.sort(
    (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0),
  )) {
    const isTv = w.media_type === "tv";
    const key = `${w.media_type}-${w.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    works.push({
      mediaType: isTv ? "tv" : "film",
      source: "tmdb",
      sourceId: String(w.id),
      title: (isTv ? w.name : w.title) ?? "Untitled",
      year: yearFrom(isTv ? w.first_air_date : w.release_date),
      coverUrl: w.poster_path ? `${IMG_BASE}${w.poster_path}` : null,
      role: w.character || w.job || null,
    });
  }

  return {
    name: data.name,
    subtitle: data.known_for_department ?? null,
    photoUrl: data.profile_path ? `${PROFILE_BASE}${data.profile_path}` : null,
    bio: data.biography || null,
    works: works.slice(0, 48),
  };
}
