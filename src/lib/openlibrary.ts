import { dedupeBy } from "./dedupe";
import type { MediaDetails } from "./media-details";
import type { Person, PersonWork } from "./people";

// Open Library book search — called server-side only (per project rules: the
// app talks to our DB; the backend talks to vendors).

export type BookResult = {
  sourceId: string; // Open Library work id, e.g. "OL45804W"
  title: string;
  author: string | null;
  year: number | null;
  coverUrl: string | null;
};

export async function searchBooks(query: string): Promise<BookResult[]> {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "24");
  url.searchParams.set(
    "fields",
    "key,title,author_name,first_publish_year,cover_i",
  );

  const res = await fetch(url, {
    headers: { "User-Agent": "Bookshelf/0.1 (dev contact: jamesflower1994@gmail.com)" },
    // Cache identical searches for an hour to be kind to Open Library.
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Open Library error: ${res.status}`);
  }

  const data = (await res.json()) as {
    docs?: Array<{
      key?: string;
      title?: string;
      author_name?: string[];
      first_publish_year?: number;
      cover_i?: number;
    }>;
  };

  const results = (data.docs ?? []).map((d) => ({
    sourceId: String(d.key ?? "").replace("/works/", ""),
    title: d.title ?? "Untitled",
    author: d.author_name?.[0] ?? null,
    year: d.first_publish_year ?? null,
    coverUrl: d.cover_i
      ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`
      : null,
  }));

  // Normalise titles so editions like "Title [adaptation]" / "Title (abridged)"
  // collapse with the plain "Title" by the same author.
  const normalize = (t: string) =>
    t.replace(/[[(].*?[\])]/g, "").replace(/\s+/g, " ").trim();

  // Only show books that have a cover.
  const withCovers = results.filter((b) => b.coverUrl);

  return dedupeBy(withCovers, (b) => `${normalize(b.title)}|${b.author ?? ""}`);
}

// Google Books usually has a real summary when Open Library doesn't. No key needed.
async function googleBooksDescription(
  title: string,
  author?: string | null,
): Promise<string | null> {
  try {
    const q =
      `intitle:${title}` + (author ? ` inauthor:${author}` : "");
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=5`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      items?: { volumeInfo?: { description?: string } }[];
    };
    for (const item of data.items ?? []) {
      const desc = item.volumeInfo?.description;
      if (desc) return desc.replace(/<[^>]*>/g, "").trim(); // strip any HTML
    }
    return null;
  } catch {
    return null;
  }
}

// Full details for one book (work). Falls back to Google Books for a summary.
export async function getBookDetails(
  workId: string,
  title?: string,
  creator?: string | null,
): Promise<MediaDetails | null> {
  const res = await fetch(`https://openlibrary.org/works/${workId}.json`, {
    headers: { "User-Agent": "Bookshelf/0.1 (jamesflower1994@gmail.com)" },
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;

  const d = (await res.json()) as {
    title?: string;
    description?: string | { value?: string };
    subjects?: string[];
    authors?: { author?: { key?: string } }[];
  };

  let description: string | null = null;
  if (typeof d.description === "string") description = d.description;
  else if (d.description?.value) description = d.description.value;

  // Open Library often has no description — fall back to Google Books.
  if (!description) {
    description = await googleBooksDescription(title || d.title || "", creator);
  }

  const facts: { label: string; value: string }[] = [];
  if (Array.isArray(d.subjects) && d.subjects.length) {
    facts.push({ label: "Subjects", value: d.subjects.slice(0, 6).join(", ") });
  }

  // Link the author to their creator page.
  const authorKey = d.authors?.[0]?.author?.key; // "/authors/OL..A"
  const authorId = authorKey ? authorKey.replace("/authors/", "") : null;

  return {
    description,
    facts,
    creatorLink: authorId ? { source: "open_library", id: authorId } : null,
  };
}

// Find an Open Library author id by exact name (fallback when Wikidata has no
// link). Exact-match only, to avoid grabbing a different person's record.
export async function findOpenLibraryAuthorId(
  name: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://openlibrary.org/search/authors.json?q=${encodeURIComponent(name)}`,
      {
        headers: { "User-Agent": "Bookshelf/0.1 (jamesflower1994@gmail.com)" },
        next: { revalidate: 86400 },
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      docs?: { key?: string; name?: string; work_count?: number }[];
    };
    const target = name.trim().toLowerCase();
    const exact = (data.docs ?? [])
      .filter((d) => d.key && d.name && d.name.toLowerCase() === target)
      .sort((a, b) => (b.work_count ?? 0) - (a.work_count ?? 0));
    return exact[0]?.key ?? null;
  } catch {
    return null;
  }
}

// The author's Wikidata id (so an author page can become cross-media), or null.
export async function getOpenLibraryWikidataId(
  authorId: string,
): Promise<string | null> {
  try {
    const res = await fetch(`https://openlibrary.org/authors/${authorId}.json`, {
      headers: { "User-Agent": "Bookshelf/0.1 (jamesflower1994@gmail.com)" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const d = (await res.json()) as { remote_ids?: { wikidata?: string } };
    return d.remote_ids?.wikidata || null;
  } catch {
    return null;
  }
}

// An author and the books they've written (Open Library author OLID, e.g. OL23919A).
export async function getOpenLibraryAuthor(
  authorId: string,
): Promise<Person | null> {
  const headers = {
    "User-Agent": "Bookshelf/0.1 (jamesflower1994@gmail.com)",
  };
  const [infoRes, searchRes] = await Promise.all([
    fetch(`https://openlibrary.org/authors/${authorId}.json`, {
      headers,
      next: { revalidate: 86400 },
    }),
    // English works with covers, via the search API (so translations are excluded).
    fetch(
      `https://openlibrary.org/search.json?author_key=${authorId}&language=eng&fields=key,title,cover_i,first_publish_year&limit=60`,
      { headers, next: { revalidate: 86400 } },
    ),
  ]);
  if (!infoRes.ok) return null;

  const info = (await infoRes.json()) as {
    name?: string;
    bio?: string | { value?: string };
  };
  const searchData = searchRes.ok
    ? ((await searchRes.json()) as {
        docs?: {
          key?: string;
          title?: string;
          cover_i?: number;
          first_publish_year?: number;
        }[];
      })
    : { docs: [] };

  const name = info.name ?? "Unknown author";
  const norm = (t: string) => t.toLowerCase().replace(/\s+/g, " ").trim();
  const seenTitle = new Set<string>();
  const works: PersonWork[] = [];
  for (const d of searchData.docs ?? []) {
    if (!d.key || !d.cover_i) continue; // cover required (drops spam)
    if (/^title tba\b/i.test(d.title ?? "")) continue; // OL placeholder works
    const titleKey = norm(d.title ?? "");
    if (seenTitle.has(titleKey)) continue; // drop duplicate work records
    seenTitle.add(titleKey);
    works.push({
      mediaType: "book",
      source: "open_library",
      sourceId: String(d.key).replace("/works/", ""),
      title: d.title ?? "Untitled",
      year: d.first_publish_year ?? null,
      coverUrl: `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`,
      role: null,
      creator: name,
    });
    if (works.length >= 24) break;
  }

  const bio =
    typeof info.bio === "string" ? info.bio : info.bio?.value ?? null;

  return { name, subtitle: "Author", photoUrl: null, bio, works };
}
