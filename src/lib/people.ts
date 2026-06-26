// Fetches a creator (actor / director / writer / music artist / author) and
// the works they're known for. Uses Wikidata to link the same person across
// our separate sources, so one page can show films, TV, music AND books.
// Server-side only.

import {
  getTmdbPerson,
  getTmdbWikidataId,
} from "./tmdb";
import { getMusicArtist, getMusicbrainzWikidataId } from "./musicbrainz";
import {
  getOpenLibraryAuthor,
  findOpenLibraryAuthorId,
  getOpenLibraryWikidataId,
} from "./openlibrary";
import { crossIdsFromWikidata } from "./wikidata";

export type PersonWork = {
  mediaType: string;
  source: string;
  sourceId: string;
  title: string;
  year: number | null;
  coverUrl: string | null;
  role: string | null; // character or job
  creator?: string | null; // e.g. author name, for logging books
};

export type RelatedPerson = {
  id: string;
  name: string;
  source: string;
};

export type Person = {
  name: string;
  subtitle: string | null;
  photoUrl: string | null;
  bio: string | null;
  works: PersonWork[];
  related?: RelatedPerson[]; // band members, or bands a person is in
  relatedLabel?: string | null; // "Members" or "Member of"
};

const MEDIA_NOUN: Record<string, string> = {
  film: "Film", tv: "TV", music: "Music", book: "Books", art: "Art", game: "Games",
};

export async function fetchPerson(
  source: string,
  id: string,
): Promise<Person | null> {
  try {
    // 1. Load the person from the source we arrived from, and their Wikidata id.
    let base: Person | null = null;
    let qid: string | null = null;
    const ids: {
      tmdb?: string;
      musicbrainz?: string;
      openLibraryAuthor?: string;
    } = {};

    if (source === "tmdb") {
      ids.tmdb = id;
      [base, qid] = await Promise.all([
        getTmdbPerson(id),
        getTmdbWikidataId(id),
      ]);
    } else if (source === "musicbrainz") {
      ids.musicbrainz = id;
      [base, qid] = await Promise.all([
        getMusicArtist(id),
        getMusicbrainzWikidataId(id),
      ]);
    } else if (source === "open_library") {
      ids.openLibraryAuthor = id;
      [base, qid] = await Promise.all([
        getOpenLibraryAuthor(id),
        getOpenLibraryWikidataId(id),
      ]);
    }

    if (!base) return null;

    // 2. Bridge to the other sources via Wikidata.
    if (qid) {
      const cross = await crossIdsFromWikidata(qid);
      if (!ids.tmdb && cross.tmdb) ids.tmdb = cross.tmdb;
      if (!ids.musicbrainz && cross.musicbrainz)
        ids.musicbrainz = cross.musicbrainz;
      if (!ids.openLibraryAuthor && cross.openLibraryAuthor)
        ids.openLibraryAuthor = cross.openLibraryAuthor;
    }

    // If Wikidata had no Open Library link, we can try matching an author by
    // name — but ONLY if that author links back to the SAME Wikidata id.
    // A bare name match would otherwise pull in books by a different person who
    // happens to share the name (e.g. an actor vs. an unrelated author).
    if (!ids.openLibraryAuthor && source !== "open_library" && qid) {
      const candidate = await findOpenLibraryAuthorId(base.name);
      if (candidate) {
        const candidateQid = await getOpenLibraryWikidataId(candidate);
        if (candidateQid && candidateQid === qid) {
          ids.openLibraryAuthor = candidate;
        }
      }
    }

    // 3. Fetch works from the *other* sources in parallel.
    const [tmdbExtra, musicExtra, bookExtra] = await Promise.all([
      ids.tmdb && source !== "tmdb" ? getTmdbPerson(ids.tmdb) : null,
      ids.musicbrainz && source !== "musicbrainz"
        ? getMusicArtist(ids.musicbrainz)
        : null,
      ids.openLibraryAuthor && source !== "open_library"
        ? getOpenLibraryAuthor(ids.openLibraryAuthor)
        : null,
    ]);

    // 4. Merge everything, de-duplicating by source + id.
    const merged = [
      ...base.works,
      ...(tmdbExtra?.works ?? []),
      ...(musicExtra?.works ?? []),
      ...(bookExtra?.works ?? []),
    ];
    const norm = (t: string) => t.toLowerCase().replace(/\s+/g, " ").trim();
    const seen = new Set<string>();
    const seenTitle = new Set<string>();
    const works = merged.filter((w) => {
      const k = `${w.source}-${w.sourceId}`;
      if (seen.has(k)) return false;
      seen.add(k);
      // Also drop repeats of the same title/year within a medium (different ids).
      const tk = `${w.mediaType}|${norm(w.title)}|${w.year ?? ""}`;
      if (seenTitle.has(tk)) return false;
      seenTitle.add(tk);
      return true;
    });

    // Subtitle summarises the media they span, e.g. "Film · Music · Books".
    const kinds = [...new Set(works.map((w) => MEDIA_NOUN[w.mediaType]))].filter(
      Boolean,
    );
    const subtitle = kinds.length > 1 ? kinds.join(" · ") : base.subtitle;

    return {
      name: base.name,
      subtitle,
      photoUrl: base.photoUrl || tmdbExtra?.photoUrl || null,
      bio: base.bio || tmdbExtra?.bio || null,
      works,
      related: base.related ?? musicExtra?.related ?? [],
      relatedLabel: base.relatedLabel ?? musicExtra?.relatedLabel ?? null,
    };
  } catch {
    return null;
  }
}
