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

  return dedupeBy(results, (b) => `${normalize(b.title)}|${b.author ?? ""}`);
}

// Full details for one book (work).
export async function getBookDetails(
  workId: string,
): Promise<MediaDetails | null> {
  const res = await fetch(`https://openlibrary.org/works/${workId}.json`, {
    headers: { "User-Agent": "Bookshelf/0.1 (jamesflower1994@gmail.com)" },
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;

  const d = (await res.json()) as {
    description?: string | { value?: string };
    subjects?: string[];
    authors?: { author?: { key?: string } }[];
  };

  let description: string | null = null;
  if (typeof d.description === "string") description = d.description;
  else if (d.description?.value) description = d.description.value;

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

// An author and the books they've written (Open Library author OLID, e.g. OL23919A).
export async function getOpenLibraryAuthor(
  authorId: string,
): Promise<Person | null> {
  const headers = {
    "User-Agent": "Bookshelf/0.1 (jamesflower1994@gmail.com)",
  };
  const [infoRes, worksRes] = await Promise.all([
    fetch(`https://openlibrary.org/authors/${authorId}.json`, {
      headers,
      next: { revalidate: 86400 },
    }),
    fetch(`https://openlibrary.org/authors/${authorId}/works.json?limit=48`, {
      headers,
      next: { revalidate: 86400 },
    }),
  ]);
  if (!infoRes.ok) return null;

  const info = (await infoRes.json()) as {
    name?: string;
    bio?: string | { value?: string };
  };
  const worksData = worksRes.ok
    ? ((await worksRes.json()) as {
        entries?: { title?: string; key?: string; covers?: number[] }[];
      })
    : { entries: [] };

  const name = info.name ?? "Unknown author";
  // Only keep works that have a real cover. Open Library frequently conflates
  // different people with the same name into one author record; the junk/spam
  // entries almost never have covers, so this filters them out.
  const works: PersonWork[] = (worksData.entries ?? [])
    .map((e) => ({ e, cover: (e.covers ?? []).find((c) => c > 0) }))
    .filter((x) => x.e.key && x.cover)
    .slice(0, 24)
    .map(({ e, cover }) => ({
      mediaType: "book",
      source: "open_library",
      sourceId: String(e.key).replace("/works/", ""),
      title: e.title ?? "Untitled",
      year: null,
      coverUrl: `https://covers.openlibrary.org/b/id/${cover}-M.jpg`,
      role: null,
      creator: name,
    }));

  const bio =
    typeof info.bio === "string" ? info.bio : info.bio?.value ?? null;

  return { name, subtitle: "Author", photoUrl: null, bio, works };
}
