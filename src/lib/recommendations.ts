import type { SupabaseClient } from "@supabase/supabase-js";

// Recommendations from a user's OWN activity only, via the rec_* views
// (per project Rule 1). media_items is read solely to display candidates.

export type RecMedia = {
  id: string;
  title: string;
  creator: string | null;
  release_year: number | null;
  cover_url: string | null;
  media_type: string;
};

export async function getRecommendations(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ byCreators: RecMedia[]; tasteMatches: RecMedia[] }> {
  const { data: myRatings } = await supabase
    .from("rec_user_ratings")
    .select("media_id, rating")
    .eq("user_id", userId);
  const myMediaIds = new Set((myRatings ?? []).map((r) => r.media_id));
  const myHighIds = (myRatings ?? [])
    .filter((r) => (r.rating ?? 0) >= 4)
    .map((r) => r.media_id);

  // 1) More from creators you rate highly.
  const { data: affinity } = await supabase
    .from("rec_creator_affinity")
    .select("creator, avg_stars, rated_count")
    .eq("user_id", userId)
    .order("avg_stars", { ascending: false })
    .order("rated_count", { ascending: false })
    .limit(5);
  const topCreators = (affinity ?? [])
    .map((a) => a.creator)
    .filter((c): c is string => !!c);

  let byCreators: RecMedia[] = [];
  if (topCreators.length > 0) {
    const { data } = await supabase
      .from("media_items")
      .select("id, title, creator, release_year, cover_url, media_type")
      .in("creator", topCreators)
      .limit(40);
    byCreators = ((data ?? []) as RecMedia[])
      .filter((m) => !myMediaIds.has(m.id))
      .slice(0, 12);
  }

  // 2) Taste matching: people who rated what you rated highly, and what *they*
  //    rated highly that you haven't tried.
  let tasteMatches: RecMedia[] = [];
  if (myHighIds.length > 0) {
    const { data: peers } = await supabase
      .from("rec_user_ratings")
      .select("user_id")
      .in("media_id", myHighIds)
      .gte("rating", 4)
      .neq("user_id", userId);
    const peerIds = [...new Set((peers ?? []).map((p) => p.user_id))];

    if (peerIds.length > 0) {
      const { data: theirs } = await supabase
        .from("rec_user_ratings")
        .select("media_id")
        .in("user_id", peerIds)
        .gte("rating", 4);
      const counts = new Map<string, number>();
      for (const row of theirs ?? []) {
        if (!myMediaIds.has(row.media_id)) {
          counts.set(row.media_id, (counts.get(row.media_id) ?? 0) + 1);
        }
      }
      const ranked = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([id]) => id);
      if (ranked.length > 0) {
        const { data } = await supabase
          .from("media_items")
          .select("id, title, creator, release_year, cover_url, media_type")
          .in("id", ranked);
        const byId = new Map(((data ?? []) as RecMedia[]).map((m) => [m.id, m]));
        tasteMatches = ranked
          .map((id) => byId.get(id))
          .filter((m): m is RecMedia => !!m);
      }
    }
  }

  return { byCreators, tasteMatches };
}
