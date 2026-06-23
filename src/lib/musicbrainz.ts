import { dedupeBy } from "./dedupe";
import type { MediaDetails } from "./media-details";
import type { Person, PersonWork, RelatedPerson } from "./people";

const UA = "Bookshelf/0.1 (dev contact: jamesflower1994@gmail.com)";

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
      "primary-type"?: string;
      "secondary-types"?: string[];
      "artist-credit"?: Array<{ name?: string }>;
    }>;
  };

  // Exclude podcasts / spoken-word releases — keep it to actual music.
  const EXCLUDE_SECONDARY = new Set([
    "Audiobook",
    "Audio drama",
    "Interview",
    "Spokenword",
  ]);

  const candidates = (data["release-groups"] ?? [])
    .filter((rg) => {
      if (rg["primary-type"] === "Broadcast") return false; // radio/podcasts
      const sec = rg["secondary-types"] ?? [];
      return !sec.some((s) => EXCLUDE_SECONDARY.has(s));
    })
    .map((rg) => {
      const date = rg["first-release-date"];
      const year = date ? Number.parseInt(date.slice(0, 4), 10) : null;
      return {
        sourceId: rg.id,
        title: rg.title ?? "Untitled",
        artist: rg["artist-credit"]?.[0]?.name ?? null,
        year: Number.isFinite(year) ? year : null,
        coverUrl: `https://coverartarchive.org/release-group/${rg.id}/front-250`,
      };
    });

  const deduped = dedupeBy(candidates, (a) => `${a.title}|${a.artist ?? ""}`);

  // Only keep albums that actually have cover art (the CAA URL can 404).
  const checked = await Promise.all(
    deduped.map(async (a) => ({ a, ok: await hasCoverArt(a.sourceId) })),
  );
  return checked.filter((x) => x.ok).map((x) => x.a);
}

// Does this release group actually have front cover art?
async function hasCoverArt(rgId: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://coverartarchive.org/release-group/${rgId}/front-250`,
      { method: "HEAD", redirect: "follow", next: { revalidate: 86400 } },
    );
    return res.ok;
  } catch {
    return false;
  }
}

// Full details for one album (release group).
export async function getMusicDetails(
  id: string,
): Promise<MediaDetails | null> {
  const url = `https://musicbrainz.org/ws/2/release-group/${id}?inc=artists+tags&fmt=json`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Bookshelf/0.1 (dev contact: jamesflower1994@gmail.com)",
    },
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;

  const d = (await res.json()) as {
    "artist-credit"?: { name?: string; artist?: { id?: string } }[];
    "primary-type"?: string;
    "first-release-date"?: string;
    tags?: { name: string; count?: number }[];
  };

  const facts: { label: string; value: string }[] = [];
  const artist = (d["artist-credit"] ?? [])
    .map((a) => a.name)
    .filter(Boolean)
    .join(", ");
  if (artist) facts.push({ label: "Artist", value: artist });
  if (d["primary-type"]) facts.push({ label: "Type", value: d["primary-type"] });
  if (d["first-release-date"])
    facts.push({ label: "Released", value: d["first-release-date"] });
  const tags = (d.tags ?? [])
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, 6)
    .map((t) => t.name)
    .join(", ");
  if (tags) facts.push({ label: "Tags", value: tags });

  const artistId = d["artist-credit"]?.[0]?.artist?.id ?? null;

  return {
    description: null,
    facts,
    creatorLink: artistId ? { source: "musicbrainz", id: artistId } : null,
  };
}

// The artist's Wikidata id (for cross-media linking), or null.
export async function getMusicbrainzWikidataId(
  mbid: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://musicbrainz.org/ws/2/artist/${mbid}?inc=url-rels&fmt=json`,
      { headers: { "User-Agent": UA }, next: { revalidate: 86400 } },
    );
    if (!res.ok) return null;
    const d = (await res.json()) as {
      relations?: { type?: string; url?: { resource?: string } }[];
    };
    const rel = (d.relations ?? []).find((r) => r.type === "wikidata");
    const match = rel?.url?.resource?.match(/Q\d+/);
    return match ? match[0] : null;
  } catch {
    return null;
  }
}

// A music artist/band and their discography (release groups = albums/EPs).
export async function getMusicArtist(mbid: string): Promise<Person | null> {
  const url = `https://musicbrainz.org/ws/2/artist/${mbid}?inc=release-groups+artist-rels&fmt=json`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;

  const d = (await res.json()) as {
    name?: string;
    type?: string;
    "release-groups"?: {
      id: string;
      title?: string;
      "first-release-date"?: string;
      "primary-type"?: string;
      "secondary-types"?: string[];
    }[];
    relations?: {
      type?: string;
      artist?: { id?: string; name?: string };
    }[];
  };
  if (!d.name) return null;

  // Band members (if a group) or bands they're in (if a person).
  const relSeen = new Set<string>();
  const related: RelatedPerson[] = [];
  for (const r of d.relations ?? []) {
    if (r.type !== "member of band" || !r.artist?.id) continue;
    if (relSeen.has(r.artist.id)) continue;
    relSeen.add(r.artist.id);
    related.push({
      id: r.artist.id,
      name: r.artist.name ?? "Unknown",
      source: "musicbrainz",
    });
  }
  const relatedLabel = d.type === "Group" ? "Members" : "Member of";

  const EXCLUDE_SECONDARY = new Set([
    "Audiobook",
    "Audio drama",
    "Interview",
    "Spokenword",
  ]);

  const candidates: PersonWork[] = (d["release-groups"] ?? [])
    .filter((rg) => {
      if (rg["primary-type"] === "Broadcast") return false; // radio/podcasts
      const sec = rg["secondary-types"] ?? [];
      return !sec.some((s) => EXCLUDE_SECONDARY.has(s));
    })
    .map((rg) => {
      const date = rg["first-release-date"];
      const year = date ? Number.parseInt(date.slice(0, 4), 10) : null;
      return {
        mediaType: "music",
        source: "musicbrainz",
        sourceId: rg.id,
        title: rg.title ?? "Untitled",
        year: Number.isFinite(year) ? year : null,
        coverUrl: `https://coverartarchive.org/release-group/${rg.id}/front-250`,
        role: rg["primary-type"] ?? null,
      };
    })
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
    .slice(0, 30); // limit cover-art checks

  // Only keep release groups that actually have cover art.
  const checked = await Promise.all(
    candidates.map(async (w) => ({ w, ok: await hasCoverArt(w.sourceId) })),
  );
  const works = checked.filter((x) => x.ok).map((x) => x.w);

  return {
    name: d.name,
    subtitle: d.type ?? "Artist",
    photoUrl: null, // MusicBrainz has no artist images
    bio: null,
    works,
    related: related.slice(0, 30),
    relatedLabel: related.length > 0 ? relatedLabel : null,
  };
}
