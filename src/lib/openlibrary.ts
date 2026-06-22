import { dedupeBy } from "./dedupe";

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

  return dedupeBy(results, (b) => `${normalize(b.title)}|${b.author ?? ""}`);
}
