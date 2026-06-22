import Link from "next/link";
import { searchBooks, type BookResult } from "@/lib/openlibrary";
import { startLog } from "../media-actions";

const BOOK_COLOR = "#4FBF7A"; // the fixed accent colour for books

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string }>;
}) {
  const { q, error: pageError } = await searchParams;
  const query = (q ?? "").trim();

  let results: BookResult[] = [];
  let error: string | null = pageError ?? null;

  if (query) {
    try {
      results = await searchBooks(query);
    } catch {
      error = "Couldn't reach Open Library just now. Please try again.";
    }
  }

  return (
    <main className="min-h-screen bg-[#15130f] text-[#f5f3ee] p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Search books
          </h1>
          <Link href="/" className="text-sm text-white/50 hover:text-white/80">
            ← Home
          </Link>
        </div>

        <form method="get" className="mt-6 flex gap-3">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Title, author, ISBN…"
            className="flex-1 rounded border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40"
          />
          <button className="rounded bg-[#f5f3ee] px-4 py-2 text-sm font-medium text-[#15130f] hover:bg-white">
            Search
          </button>
        </form>

        {error && (
          <p className="mt-6 rounded bg-[#D94F4F]/15 border border-[#D94F4F]/30 p-3 text-sm text-[#eaa]">
            {error}
          </p>
        )}

        {query && !error && results.length === 0 && (
          <p className="mt-6 text-sm text-white/50">
            No books found for “{query}”.
          </p>
        )}

        {results.length > 0 && (
          <ul className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {results.map((book) => (
              <li key={book.sourceId}>
                <div className="flex overflow-hidden rounded border border-white/10">
                  {/* thin left bar in the book medium colour */}
                  <div
                    className="w-1 shrink-0"
                    style={{ background: BOOK_COLOR }}
                  />
                  <div className="relative aspect-[2/3] flex-1 bg-black/30">
                    {book.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={book.coverUrl}
                        alt={`Cover of ${book.title}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-white/80"
                        style={{
                          background: `linear-gradient(160deg, ${BOOK_COLOR}33, #15130f)`,
                        }}
                      >
                        {book.title}
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-medium leading-tight">
                  {book.title}
                </p>
                <p className="text-xs text-white/50">
                  {book.author ?? "Unknown author"}
                  {book.year ? ` · ${book.year}` : ""}
                </p>
                <form action={startLog} className="mt-2">
                  <input type="hidden" name="media_type" value="book" />
                  <input type="hidden" name="source" value="open_library" />
                  <input type="hidden" name="source_id" value={book.sourceId} />
                  <input type="hidden" name="title" value={book.title} />
                  <input type="hidden" name="creator" value={book.author ?? ""} />
                  <input
                    type="hidden"
                    name="release_year"
                    value={book.year ?? ""}
                  />
                  <input
                    type="hidden"
                    name="cover_url"
                    value={book.coverUrl ?? ""}
                  />
                  <button className="w-full rounded border border-white/20 px-2 py-1.5 text-xs font-medium hover:bg-white/5">
                    Log this book
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
