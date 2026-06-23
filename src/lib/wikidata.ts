// Wikidata is the bridge that lets us link one real person across our separate
// sources. Given a Wikidata entity id (Qxxxx), pull the person's IDs on the
// other platforms. Server-side only.

export type CrossIds = {
  tmdb?: string; // P4985  TMDb person ID
  musicbrainz?: string; // P434   MusicBrainz artist ID
  openLibraryAuthor?: string; // P648   Open Library ID (author, ends in "A")
};

export async function crossIdsFromWikidata(qid: string): Promise<CrossIds> {
  const res = await fetch(
    `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`,
    { next: { revalidate: 86400 } },
  );
  if (!res.ok) return {};

  const data = (await res.json()) as {
    entities?: Record<
      string,
      {
        claims?: Record<
          string,
          { mainsnak?: { datavalue?: { value?: unknown } } }[]
        >;
      }
    >;
  };

  const claims = data.entities?.[qid]?.claims ?? {};
  const val = (prop: string): string | undefined => {
    const v = claims[prop]?.[0]?.mainsnak?.datavalue?.value;
    return typeof v === "string" ? v : undefined;
  };

  const ol = val("P648");
  return {
    tmdb: val("P4985"),
    musicbrainz: val("P434"),
    openLibraryAuthor: ol && ol.endsWith("A") ? ol : undefined,
  };
}
