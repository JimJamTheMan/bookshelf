import { dedupeBy } from "./dedupe";

// Music search via MusicBrainz (metadata) + Cover Art Archive (covers).
// Server-side only. MusicBrainz requires a descriptive User-Agent and limits to
// ~1 request/second. We search "release groups" (albums), not individual releases.

export type MusicResult = {
  sourceId: string; // MusicBrainz release-group MBID
  title: string;
  artist: string | null;
  year: number | null;
  coverUrl: string | null;
};

export async function searchMusic(query: string): Promise<MusicResult[]> {
  const url = new URL("https://musicbrainz.org/ws/2/release-group");
  url.searchParams.set("query", query);
  url.searchParams.set("fmt", "json");
  url.searchParams.set("limit", "24");

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Bookshelf/0.1 (dev contact: jamesflower1994@gmail.com)",
    },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`MusicBrainz error: ${res.status}`);

  const data = (await res.json()) as {
    "release-groups"?: Array<{
      id: string;
      title?: string;
      "first-release-date"?: string;
      "artist-credit"?: Array<{ name?: string }>;
    }>;
  };

  const results = (data["release-groups"] ?? []).map((rg) => {
    const date = rg["first-release-date"];
    const year = date ? Number.parseInt(date.slice(0, 4), 10) : null;
    return {
      sourceId: rg.id,
      title: rg.title ?? "Untitled",
      artist: rg["artist-credit"]?.[0]?.name ?? null,
      year: Number.isFinite(year) ? year : null,
      // Cover Art Archive front cover for this album (may 404 — the Cover
      // component falls back to a tinted tile if so).
      coverUrl: `https://coverartarchive.org/release-group/${rg.id}/front-250`,
    };
  });

  return dedupeBy(results, (a) => `${a.title}|${a.artist ?? ""}`);
}
