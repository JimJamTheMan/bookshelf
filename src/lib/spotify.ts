// Spotify lookup for music items. Uses the Client Credentials flow, which only
// needs an app's client id + secret (no user login). Returns null whenever the
// credentials are missing or nothing matches, so callers degrade gracefully.

const TOKEN_URL = "https://accounts.spotify.com/api/token";

let cached: { value: string; expiresAt: number } | null = null;

async function getToken(): Promise<string | null> {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) return null;

  const now = Date.now() / 1000;
  if (cached && cached.expiresAt > now + 30) return cached.value;

  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    cached = {
      value: data.access_token,
      expiresAt: now + (data.expires_in ?? 3600),
    };
    return cached.value;
  } catch {
    return null;
  }
}

export type SpotifyAlbum = { id: string; url: string };

// Find the best-matching Spotify album for a title (+ optional artist).
export async function findSpotifyAlbum(
  title: string,
  artist?: string | null,
): Promise<SpotifyAlbum | null> {
  const token = await getToken();
  if (!token) return null;

  const q = artist ? `album:${title} artist:${artist}` : `album:${title}`;
  const url = `https://api.spotify.com/v1/search?type=album&limit=5&q=${encodeURIComponent(q)}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const items = (data.albums?.items ?? []) as {
      id: string;
      external_urls?: { spotify?: string };
    }[];
    if (items.length === 0) return null;
    const a = items[0];
    return {
      id: a.id,
      url: a.external_urls?.spotify ?? `https://open.spotify.com/album/${a.id}`,
    };
  } catch {
    return null;
  }
}
