// Pick the first YouTube video id that is actually embeddable.
//
// YouTube's oEmbed endpoint returns 200 for embeddable videos, but 401 when the
// uploader has disabled embedding (and 404 for private/removed). So we can probe
// each candidate server-side — no API key needed — and skip the ones that would
// show the "An error occurred" message inside an embed.
export async function pickEmbeddableYouTube(
  keys: string[],
): Promise<string | null> {
  for (const key of keys.slice(0, 5)) {
    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(
          `https://www.youtube.com/watch?v=${key}`,
        )}`,
        { next: { revalidate: 86400 } },
      );
      if (res.ok) return key;
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}
