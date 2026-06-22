import { dedupeBy } from "./dedupe";

// IGDB game search — called server-side only. IGDB is owned by Twitch, so we
// exchange a Twitch Client ID + Secret for an OAuth token (cached in memory
// until it nears expiry), then call IGDB with that token.

export type GameResult = {
  sourceId: string; // IGDB numeric id, as a string
  title: string;
  year: number | null;
  coverUrl: string | null;
  description: string | null;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (
    !clientId ||
    !clientSecret ||
    clientId.startsWith("PASTE_") ||
    clientSecret.startsWith("PASTE_")
  ) {
    throw new Error("TWITCH_CLIENT_ID/SECRET is not set");
  }

  // Reuse the cached token until ~1 minute before it expires.
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const url = new URL("https://id.twitch.tv/oauth2/token");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("grant_type", "client_credentials");

  const res = await fetch(url, { method: "POST" });
  if (!res.ok) throw new Error(`Twitch token error: ${res.status}`);
  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.value;
}

export async function searchGames(query: string): Promise<GameResult[]> {
  const token = await getToken();
  const clientId = process.env.TWITCH_CLIENT_ID!;

  // IGDB uses its own query language (APICalypse) in the POST body.
  const body = `search "${query.replace(/"/g, '\\"')}"; fields name, first_release_date, cover.image_id, summary; limit 24;`;

  const res = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body,
  });
  if (!res.ok) throw new Error(`IGDB error: ${res.status}`);

  const games = (await res.json()) as Array<{
    id: number;
    name?: string;
    first_release_date?: number; // unix seconds
    cover?: { image_id?: string };
    summary?: string;
  }>;

  const results = games.map((g) => ({
    sourceId: String(g.id),
    title: g.name ?? "Untitled",
    year: g.first_release_date
      ? new Date(g.first_release_date * 1000).getUTCFullYear()
      : null,
    coverUrl: g.cover?.image_id
      ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg`
      : null,
    description: g.summary || null,
  }));

  return dedupeBy(results, (g) => `${g.title}|${g.year ?? ""}`);
}
