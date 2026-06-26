import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Cover } from "../../_components/Cover";
import { starsFromRating } from "@/lib/stars";
import { fetchMediaDetails } from "@/lib/media-details";
import { openMedia } from "@/app/media-actions";
import { coverAspect, hiResCover } from "@/lib/format";
import { ShareButton } from "../../_components/ShareButton";
import { findSpotifyAlbum } from "@/lib/spotify";
import { TrailerEmbed } from "../../_components/TrailerEmbed";
import { pickEmbeddableYouTube } from "@/lib/youtube";
import { Bio } from "../../_components/Bio";
import { BackButton } from "@/app/_components/BackButton";

const MEDIA_COLOR: Record<string, string> = {
  book: "#4FBF7A", film: "#D94F4F", tv: "#4F7ED9",
  music: "#D94FB8", game: "#7A4FD9", art: "#BFA34F",
};

const MEDIA_LABEL: Record<string, string> = {
  book: "Book", film: "Film", tv: "TV", music: "Music", game: "Game", art: "Art",
};

const REGION_NAMES: Record<string, string> = {
  US: "USA", GB: "UK", FR: "France", DE: "Germany", IT: "Italy",
  ES: "Spain", JP: "Japan", CA: "Canada", AU: "Australia", IE: "Ireland",
  NZ: "New Zealand", IN: "India", BR: "Brazil", MX: "Mexico", RU: "Russia",
  KR: "South Korea", CN: "China", NL: "Netherlands", SE: "Sweden",
};

type Author = { id: string; handle: string; display_name: string | null };

function formatDate(iso: string): string {
  const d = new Date(iso);
  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getUTCDate()} ${m[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export default async function MediaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: media } = await supabase
    .from("media_items")
    .select(
      "id, media_type, source, source_id, title, creator, release_year, cover_url, description, avg_rating, log_count",
    )
    .eq("id", id)
    .single();

  if (!media) notFound();

  const color = MEDIA_COLOR[media.media_type] ?? "#888";

  const details = await fetchMediaDetails(
    media.media_type,
    media.source,
    media.source_id,
    { title: media.title, creator: media.creator },
  );
  const description = details?.description || media.description || null;
  const facts = details?.facts ?? [];
  const genres = details?.genres ?? [];
  const cast = details?.cast ?? [];
  const crew = details?.crew ?? [];
  const releases = details?.releases ?? [];
  const backdropUrl = details?.backdropUrl ?? null;
  const tagline = details?.tagline ?? null;
  const creatorLink = details?.creatorLink ?? null;
  const contributors = details?.contributors ?? [];
  const similar = details?.similar ?? [];
  const trailerKeys = details?.trailerKeys ?? [];
  // Pick the first trailer that actually allows embedding (skip the ones that
  // would show YouTube's "An error occurred" message).
  const trailerKey =
    trailerKeys.length > 0 ? await pickEmbeddableYouTube(trailerKeys) : null;

  // Spotify: embed a player for albums (when credentials are configured),
  // otherwise fall back to a "Listen on Spotify" search link.
  const spotify =
    media.media_type === "music"
      ? await findSpotifyAlbum(media.title, media.creator)
      : null;
  const spotifySearchUrl = `https://open.spotify.com/search/${encodeURIComponent(
    `${media.title} ${media.creator ?? ""}`.trim(),
  )}`;
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${media.title} ${media.creator ?? ""}`.trim(),
  )}`;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let myLog: { status: string; rating: number | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from("logs")
      .select("status, rating")
      .eq("user_id", user.id)
      .eq("media_id", id)
      .maybeSingle();
    myLog = data;
  }

  const { data: reviewsRaw } = await supabase
    .from("logs")
    .select("id, user_id, rating, review, created_at")
    .eq("media_id", id)
    .not("review", "is", null)
    .order("created_at", { ascending: false })
    .limit(30);
  const reviews = reviewsRaw ?? [];

  const authorIds = [...new Set(reviews.map((r) => r.user_id))];
  const authors: Record<string, Author> = {};
  if (authorIds.length > 0) {
    const { data: ap } = await supabase
      .from("profiles")
      .select("id, handle, display_name")
      .in("id", authorIds);
    for (const a of (ap ?? []) as Author[]) authors[a.id] = a;
  }

  const avg = media.avg_rating != null ? Number(media.avg_rating) : null;
  const logBtn = user ? (
    <Link
      href={`/log/${media.id}`}
      className="inline-block rounded bg-[#e8c58f] px-4 py-2 text-sm font-medium text-[#200f0a] hover:bg-white"
    >
      {myLog ? "Edit your log" : "Log this"}
    </Link>
  ) : (
    <Link
      href="/login"
      className="inline-block rounded bg-[#e8c58f] px-4 py-2 text-sm font-medium text-[#200f0a] hover:bg-white"
    >
      Log in to add this
    </Link>
  );

  const titleBlock = (
    <div className="min-w-0 flex-1">
      <span
        className="inline-block rounded px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide"
        style={{ background: `${color}22`, color }}
      >
        {MEDIA_LABEL[media.media_type] ?? media.media_type}
      </span>
      <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight">
        {media.title}
        {media.release_year && (
          <span className="font-normal text-white/40"> ({media.release_year})</span>
        )}
      </h1>
      {contributors.length > 0 ? (
        <p className="mt-1 text-sm text-white/50">
          {contributors.map((c, i) => (
            <span key={`${c.name}-${i}`}>
              {i > 0 && ", "}
              {c.id ? (
                <Link
                  href={`/person/${c.source}/${encodeURIComponent(c.id)}`}
                  className="font-medium text-white/80 underline underline-offset-2 decoration-white/30 hover:decoration-white"
                >
                  {c.name}
                </Link>
              ) : (
                c.name
              )}
            </span>
          ))}
        </p>
      ) : (
        media.creator && (
          <p className="mt-1 text-sm text-white/50">
            {creatorLink ? (
              <Link
                href={`/person/${creatorLink.source}/${encodeURIComponent(creatorLink.id)}`}
                className="font-medium text-white/80 underline underline-offset-2 decoration-white/30 hover:decoration-white"
              >
                {media.creator}
              </Link>
            ) : (
              media.creator
            )}
          </p>
        )
      )}
      {crew.length > 0 && (
        <p className="mt-1 text-sm text-white/50">
          {crew.map((c, i) => (
            <span key={`${c.id}-${c.job}`}>
              {i > 0 && ", "}
              <Link
                href={`/person/tmdb/${c.id}`}
                className="font-medium text-white/80 underline underline-offset-2 decoration-white/30 hover:decoration-white"
              >
                {c.name}
              </Link>
              <span className="text-white/30"> ({c.job})</span>
            </span>
          ))}
        </p>
      )}
      {tagline && (
        <p className="mt-2 text-sm italic text-white/50">“{tagline}”</p>
      )}
      <div className="mt-3 flex items-center gap-4 text-sm">
        {avg != null ? (
          <span className="text-[#f5d56b]">{(avg / 2).toFixed(1)}/5 ★</span>
        ) : (
          <span className="text-white/40">No ratings yet</span>
        )}
        <span className="text-white/40">
          {media.log_count ?? 0} log{(media.log_count ?? 0) === 1 ? "" : "s"}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {logBtn}
        <ShareButton title={media.title} />
      </div>
    </div>
  );

  const poster = (
    <div className="flex w-32 shrink-0 self-start overflow-hidden rounded border border-white/10">
      <div className="w-1.5 shrink-0" style={{ background: color }} />
      <div className={`${coverAspect(media.media_type)} flex-1 bg-black/30`}>
        <Cover src={media.cover_url} title={media.title} color={color} />
      </div>
    </div>
  );

  const heroImg = backdropUrl ?? media.cover_url;

  return (
    <main className="min-h-screen text-[#e8c58f]">
      {/* Hero — real backdrop for films/TV, blurred cover for everything else */}
      {heroImg ? (
        <div className="relative">
          <div className="absolute inset-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hiResCover(heroImg) ?? heroImg}
              alt=""
              className={`h-full w-full object-cover opacity-25 ${
                backdropUrl ? "" : "scale-125 blur-2xl"
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#200f0a] via-[#200f0a]/80 to-[#200f0a]/40" />
          </div>
          <div className="relative mx-auto max-w-3xl px-4 sm:px-8 pb-6 pt-6">
            <BackButton className="text-sm text-white/60 hover:text-white" />
            <div className="mt-16 flex items-end gap-6">
              {poster}
              {titleBlock}
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl px-4 sm:px-8 pt-6">
          <BackButton className="text-sm text-white/50 hover:text-white/80" />
          <div className="mt-4 flex gap-6">
            {poster}
            {titleBlock}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 sm:px-8 pb-12">
        {genres.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {genres.map((g) => (
              <span
                key={g}
                className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70"
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {description && <Bio text={description} />}

        {/* Trailer (films, TV, games) */}
        {trailerKeys.length > 0 &&
          (media.media_type === "film" ||
            media.media_type === "tv" ||
            media.media_type === "game") && (
            <section className="mt-8">
              <h2 className="text-sm font-medium uppercase tracking-wide text-white/40">
                Trailer
              </h2>
              {trailerKey ? (
                <TrailerEmbed id={trailerKey} />
              ) : (
                // No embeddable trailer — link out instead of a broken player.
                <a
                  href={`https://www.youtube.com/watch?v=${trailerKeys[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#FF0000] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  ▶ Watch trailer on YouTube
                </a>
              )}
            </section>
          )}

        {/* Listen (music): Spotify player + YouTube */}
        {media.media_type === "music" && (
          <section className="mt-8">
            <h2 className="text-sm font-medium uppercase tracking-wide text-white/40">
              Listen
            </h2>
            {spotify && (
              <div className="mt-3 max-w-2xl overflow-hidden rounded-xl">
                <iframe
                  src={`https://open.spotify.com/embed/album/${spotify.id}?theme=0`}
                  width="100%"
                  height="152"
                  style={{ border: 0 }}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  title="Spotify player"
                />
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={youtubeSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#FF0000] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                ▶ YouTube
              </a>
              {!spotify && (
                <a
                  href={spotifySearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#1DB954] px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
                >
                  Listen on Spotify
                </a>
              )}
            </div>
          </section>
        )}

        {facts.length > 0 && (
          <dl className="mt-8 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
            {facts.map((f) => (
              <div key={f.label} className="flex gap-2 text-sm">
                <dt className="shrink-0 text-white/40">{f.label}:</dt>
                <dd className="text-white/80">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {cast.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-medium uppercase tracking-wide text-white/40">
              Cast
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {cast.map((c) => (
                <li
                  key={`${c.name}-${c.character ?? ""}`}
                  className="rounded border border-white/10 bg-black/20 px-3 py-2 text-sm"
                >
                  {c.id ? (
                    <Link
                      href={`/person/tmdb/${c.id}`}
                      className="text-white/90 hover:underline"
                    >
                      {c.name}
                    </Link>
                  ) : (
                    <span className="text-white/90">{c.name}</span>
                  )}
                  {c.character && (
                    <span className="block text-xs text-white/40">
                      {c.character}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {releases.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-medium uppercase tracking-wide text-white/40">
              Releases
            </h2>
            <ul className="mt-3 grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
              {releases.slice(0, 24).map((r) => (
                <li
                  key={`${r.region}-${r.date}`}
                  className="flex items-center justify-between gap-2 border-b border-white/5 py-1 text-sm"
                >
                  <span className="text-white/70">
                    {REGION_NAMES[r.region] ?? r.region}
                    {r.cert ? (
                      <span className="ml-2 rounded border border-white/15 px-1 text-[10px] text-white/40">
                        {r.cert}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-white/50">{formatDate(r.date)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {similar.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-medium uppercase tracking-wide text-white/40">
              {media.media_type === "tv"
                ? "Similar shows"
                : media.media_type === "book"
                  ? "More by this author"
                  : media.media_type === "game"
                    ? "Similar games"
                    : "Similar films"}
            </h2>
            <ul className="mt-3 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
              {similar.map((s) => (
                <li key={`${s.source}-${s.sourceId}`}>
                  <form action={openMedia}>
                    <input type="hidden" name="media_type" value={s.mediaType} />
                    <input type="hidden" name="source" value={s.source} />
                    <input type="hidden" name="source_id" value={s.sourceId} />
                    <input type="hidden" name="title" value={s.title} />
                    <input
                      type="hidden"
                      name="release_year"
                      value={s.year ?? ""}
                    />
                    <input
                      type="hidden"
                      name="cover_url"
                      value={s.coverUrl ?? ""}
                    />
                    <button type="submit" className="block w-full text-left">
                      <div className="tile flex overflow-hidden rounded border border-white/10">
                        <div
                          className="w-1 shrink-0"
                          style={{ background: color }}
                        />
                        <div className={`${coverAspect(s.mediaType)} flex-1 bg-black/30`}>
                          <Cover
                            src={s.coverUrl}
                            title={s.title}
                            color={color}
                          />
                        </div>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs font-medium leading-tight">
                        {s.title}
                      </p>
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Reviews */}
        <h2 className="mt-10 text-sm font-medium uppercase tracking-wide text-white/40">
          Reviews
        </h2>
        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-white/50">
            No written reviews yet — be the first.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {reviews.map((r) => {
              const a = authors[r.user_id];
              return (
                <li
                  key={r.id}
                  className="rounded-lg border border-white/10 bg-black/20 p-4"
                >
                  <p className="text-sm text-white/60">
                    <Link
                      href={`/u/${a?.handle ?? ""}`}
                      className="font-medium text-white/90 hover:underline"
                    >
                      {a?.display_name || a?.handle || "Someone"}
                    </Link>
                    {r.rating ? (
                      <span className="text-[#f5d56b]">
                        {" · "}
                        {starsFromRating(r.rating)}
                      </span>
                    ) : null}
                    <span className="text-white/40">
                      {" · "}
                      {formatDate(r.created_at)}
                    </span>
                  </p>
                  <Link href={`/review/${r.id}`} className="block">
                    <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-white/80 hover:text-white">
                      {r.review}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
