// Fetches a creator (actor / director / writer / music artist) and the works
// they're known for, from whichever source. Server-side only.

import { getTmdbPerson } from "./tmdb";
import { getMusicArtist } from "./musicbrainz";

export type PersonWork = {
  mediaType: string;
  source: string;
  sourceId: string;
  title: string;
  year: number | null;
  coverUrl: string | null;
  role: string | null; // character or job
};

export type Person = {
  name: string;
  subtitle: string | null; // e.g. "Acting", "Directing", "Band"
  photoUrl: string | null;
  bio: string | null;
  works: PersonWork[];
};

export async function fetchPerson(
  source: string,
  id: string,
): Promise<Person | null> {
  try {
    if (source === "tmdb") return await getTmdbPerson(id);
    if (source === "musicbrainz") return await getMusicArtist(id);
    return null;
  } catch {
    return null;
  }
}
