// Fetches rich details for one catalogue item on demand, from whichever vendor
// it came from. Server-side only. Results are normalised to a description plus
// a list of "facts" (label/value) so the media page can render any type the same.

import { getBookDetails } from "./openlibrary";
import { getScreenDetails } from "./tmdb";
import { getGameDetails } from "./igdb";
import { getMusicDetails } from "./musicbrainz";
import { getArtDetails } from "./wikimedia";

export type MediaDetails = {
  description: string | null;
  facts: { label: string; value: string }[];
  // Richer fields, mainly for films/TV (Letterboxd-style layout):
  backdropUrl?: string | null;
  tagline?: string | null;
  genres?: string[];
  cast?: { id: number | null; name: string; character: string | null }[];
  crew?: { id: number; name: string; job: string }[];
  releases?: { region: string; date: string; cert: string | null }[];
  // For music: link the album's artist to their person page.
  creatorLink?: { source: string; id: string } | null;
  // Credited people to show as links (e.g. all artists on a release).
  contributors?: { id: string | null; name: string; source: string }[];
  // Candidate YouTube trailer ids (films/TV/games), best first. The page picks
  // the first one that's actually embeddable.
  trailerKeys?: string[];
  // "Similar" items (cache-on-click tiles, like search results).
  similar?: {
    mediaType: string;
    source: string;
    sourceId: string;
    title: string;
    year: number | null;
    coverUrl: string | null;
  }[];
};

export async function fetchMediaDetails(
  mediaType: string,
  source: string,
  sourceId: string,
  meta?: { title?: string; creator?: string | null },
): Promise<MediaDetails | null> {
  try {
    switch (source) {
      case "open_library":
        return await getBookDetails(sourceId, meta?.title, meta?.creator);
      case "tmdb":
        return await getScreenDetails(mediaType, sourceId);
      case "igdb":
        return await getGameDetails(sourceId);
      case "musicbrainz":
        return await getMusicDetails(sourceId);
      case "wikimedia":
        return await getArtDetails(sourceId);
      default:
        return null;
    }
  } catch {
    return null; // never let a details fetch break the page
  }
}
