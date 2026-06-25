import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Cover } from "../_components/Cover";
import { displayTitle } from "@/lib/format";
import { getRecommendations } from "@/lib/recommendations";

const MEDIA_COLOR: Record<string, string> = {
  book: "#4FBF7A", film: "#D94F4F", tv: "#4F7ED9",
  music: "#D94FB8", game: "#7A4FD9", art: "#BFA34F",
};

type Media = {
  id: string;
  title: string;
  creator: string | null;
  release_year: number | null;
  cover_url: string | null;
  media_type: string;
};

function Grid({ items }: { items: Media[] }) {
  return (
    <ul className="mt-3 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map((m) => (
        <li key={m.id}>
          <Link href={`/media/${m.id}`}>
            <div className="flex overflow-hidden rounded border border-white/10">
              <div className="w-1 shrink-0" style={{ background: MEDIA_COLOR[m.media_type] ?? "#888" }} />
              <div className="aspect-[2/3] flex-1 bg-black/30">
                <Cover src={m.cover_url} title={m.title} color={MEDIA_COLOR[m.media_type] ?? "#888"} />
              </div>
            </div>
          </Link>
          <p className="mt-2 line-clamp-2 text-sm font-medium leading-tight">
            {displayTitle(m.title, m.release_year, m.media_type)}
          </p>
          <p className="text-xs text-white/50">{m.creator ?? ""}</p>
        </li>
      ))}
    </ul>
  );
}

export default async function RecommendationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Recommendations read ONLY user data via rec_* views (project Rule 1).
  const { byCreators, tasteMatches } = await getRecommendations(
    supabase,
    user.id,
  );
  const hasAny = byCreators.length > 0 || tasteMatches.length > 0;

  return (
    <main className="min-h-screen bg-[#15130f] text-[#f5f3ee] px-4 py-8 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">For you</h1>
          <Link href="/" className="text-sm text-white/50 hover:text-white/80">
            ← Home
          </Link>
        </div>
        <p className="mt-1 text-sm text-white/50">
          Suggestions based only on your own ratings and activity.
        </p>

        {!hasAny ? (
          <p className="mt-10 text-center text-sm text-white/50">
            Log and rate a few more things (4★+) and recommendations will start
            appearing here.
          </p>
        ) : (
          <>
            {byCreators.length > 0 && (
              <section className="mt-8">
                <h2 className="text-sm font-medium uppercase tracking-wide text-white/40">
                  More from creators you rate highly
                </h2>
                <Grid items={byCreators} />
              </section>
            )}
            {tasteMatches.length > 0 && (
              <section className="mt-10">
                <h2 className="text-sm font-medium uppercase tracking-wide text-white/40">
                  People with similar taste also rated these
                </h2>
                <Grid items={tasteMatches} />
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
