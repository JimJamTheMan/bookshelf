import { dedupeBy } from "./dedupe";
import type { MediaDetails } from "./media-details";

// Art search via Wikimedia Commons (no API key needed). Server-side only.
// Uses the MediaWiki API to search File-namespace images and pull thumbnails
// plus basic metadata (title, artist).

export type ArtResult = {
  sourceId: string; // Wikimedia Commons page id, as a string
  title: string;
  artist: string | null;
  coverUrl: string | null;
};

function stripHtml(s?: string): string | null {
  if (!s) return null;
  const text = s
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#0?39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
  return text || null;
}

export async function searchArt(query: string): Promise<ArtResult[]> {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", query);
  url.searchParams.set("gsrnamespace", "6"); // File namespace
  url.searchParams.set("gsrlimit", "24");
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|extmetadata");
  url.searchParams.set("iiurlwidth", "400");

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Bookshelf/0.1 (dev contact: jamesflower1994@gmail.com)",
    },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Wikimedia error: ${res.status}`);

  const data = (await res.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          pageid?: number;
          title?: string;
          imageinfo?: Array<{
            thumburl?: string;
            extmetadata?: {
              ObjectName?: { value?: string };
              Artist?: { value?: string };
            };
          }>;
        }
      >;
    };
  };

  const pages = data.query?.pages ?? {};
  const results = Object.values(pages).map((p) => {
    const info = p.imageinfo?.[0];
    const meta = info?.extmetadata ?? {};
    const rawTitle = (p.title ?? "")
      .replace(/^File:/, "")
      .replace(/\.[a-zA-Z0-9]+$/, "");
    return {
      sourceId: String(p.pageid ?? p.title ?? ""),
      title: stripHtml(meta.ObjectName?.value) || rawTitle || "Untitled",
      artist: stripHtml(meta.Artist?.value),
      coverUrl: info?.thumburl ?? null,
    };
  });

  // Only show artworks that actually have an image.
  const withImages = results.filter((a) => a.coverUrl);

  return dedupeBy(withImages, (a) => `${a.title}|${a.artist ?? ""}`);
}

// Full details for one artwork (by Commons page id).
export async function getArtDetails(
  pageid: string,
): Promise<MediaDetails | null> {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("pageids", pageid);
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "extmetadata");

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Bookshelf/0.1 (dev contact: jamesflower1994@gmail.com)",
    },
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          imageinfo?: Array<{
            extmetadata?: Record<string, { value?: string }>;
          }>;
        }
      >;
    };
  };

  const pages = Object.values(data.query?.pages ?? {});
  const meta = pages[0]?.imageinfo?.[0]?.extmetadata ?? {};

  const facts: { label: string; value: string }[] = [];
  const artist = stripHtml(meta.Artist?.value);
  if (artist) facts.push({ label: "Artist", value: artist });
  const date = stripHtml(meta.DateTimeOriginal?.value) || stripHtml(meta.DateTime?.value);
  if (date) facts.push({ label: "Date", value: date });
  const medium = stripHtml(meta.Medium?.value);
  if (medium) facts.push({ label: "Medium", value: medium });
  const credit = stripHtml(meta.Credit?.value);
  if (credit) facts.push({ label: "Source", value: credit });

  return { description: stripHtml(meta.ImageDescription?.value), facts };
}
