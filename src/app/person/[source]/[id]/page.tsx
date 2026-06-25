import Link from "next/link";
import { notFound } from "next/navigation";
import { Cover } from "../../../_components/Cover";
import { fetchPerson, type PersonWork } from "@/lib/people";
import { openMedia } from "@/app/media-actions";
import { coverAspect, displayTitle } from "@/lib/format";

const MEDIA_COLOR: Record<string, string> = {
  book: "#4FBF7A", film: "#D94F4F", tv: "#4F7ED9",
  music: "#D94FB8", game: "#7A4FD9", art: "#BFA34F",
};

const SECTION_ORDER = ["film", "tv", "music", "book", "art", "game"];
const SECTION_LABEL: Record<string, string> = {
  film: "Films", tv: "TV", music: "Music", book: "Books", art: "Art", game: "Games",
};

function WorkTile({ w }: { w: PersonWork }) {
  const color = MEDIA_COLOR[w.mediaType] ?? "#888";
  return (
    <li>
      <form action={openMedia}>
        <input type="hidden" name="media_type" value={w.mediaType} />
        <input type="hidden" name="source" value={w.source} />
        <input type="hidden" name="source_id" value={w.sourceId} />
        <input type="hidden" name="title" value={w.title} />
        {w.creator && <input type="hidden" name="creator" value={w.creator} />}
        <input type="hidden" name="release_year" value={w.year ?? ""} />
        <input type="hidden" name="cover_url" value={w.coverUrl ?? ""} />
        <button type="submit" className="block w-full text-left">
          <div className="flex overflow-hidden rounded border border-white/10">
            <div className="w-1 shrink-0" style={{ background: color }} />
            <div className={`${coverAspect(w.mediaType)} flex-1 bg-black/30`}>
              <Cover src={w.coverUrl} title={w.title} color={color} />
            </div>
          </div>
          <p className="mt-2 line-clamp-2 text-sm font-medium leading-tight">
            {displayTitle(w.title, w.year, w.mediaType)}
          </p>
          {w.role && (
            <p className="line-clamp-1 text-xs text-white/40">{w.role}</p>
          )}
        </button>
      </form>
    </li>
  );
}

export default async function PersonPage({
  params,
}: {
  params: Promise<{ source: string; id: string }>;
}) {
  const { source, id } = await params;
  const person = await fetchPerson(source, decodeURIComponent(id));
  if (!person) notFound();

  return (
    <main className="min-h-screen bg-[#200f0a] text-[#e8c58f] px-4 py-8 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm text-white/50 hover:text-white/80">
          ← Home
        </Link>

        <div className="mt-4 flex items-start gap-5">
          {person.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.photoUrl}
              alt=""
              className="h-28 w-28 shrink-0 rounded-full border border-white/10 object-cover"
            />
          ) : (
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-3xl text-white/40">
              {person.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              {person.name}
            </h1>
            {person.subtitle && (
              <p className="mt-1 text-sm text-white/50">{person.subtitle}</p>
            )}
          </div>
        </div>

        {person.bio && (
          <p className="mt-5 max-w-prose whitespace-pre-wrap text-sm leading-relaxed text-white/75 line-clamp-6">
            {person.bio}
          </p>
        )}

        {person.related && person.related.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-medium uppercase tracking-wide text-white/40">
              {person.relatedLabel ?? "Related"}
            </h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {person.related.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/person/${m.source}/${m.id}`}
                    className="inline-block rounded-full border border-white/15 px-3 py-1 text-sm text-white/80 hover:border-white/40 hover:bg-white/5"
                  >
                    {m.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {person.works.length === 0 ? (
          <p className="mt-8 text-sm text-white/50">Nothing found.</p>
        ) : (
          SECTION_ORDER.map((type) => {
            const items = person.works.filter((w) => w.mediaType === type);
            if (items.length === 0) return null;
            return (
              <section key={type} className="mt-8">
                <h2 className="text-sm font-medium uppercase tracking-wide text-white/40">
                  {SECTION_LABEL[type] ?? type}{" "}
                  <span className="text-white/25">{items.length}</span>
                </h2>
                <ul className="mt-3 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {items.map((w) => (
                    <WorkTile key={`${w.mediaType}-${w.sourceId}`} w={w} />
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </div>
    </main>
  );
}
