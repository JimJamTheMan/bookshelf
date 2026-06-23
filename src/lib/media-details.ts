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
};

export async function fetchMediaDetails(
  mediaType: string,
  source: string,
  sourceId: string,
): Promise<MediaDetails | null> {
  try {
    switch (source) {
      case "open_library":
        return await getBookDetails(sourceId);
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
