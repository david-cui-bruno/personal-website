// Vercel serverless function: /api/spotify
// Returns { nowPlaying, lastPlayed, topArtists } from the owner's Spotify.
// Env vars (Vercel → Settings → Environment Variables):
//   SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN
// Get the refresh token by running: node scripts/spotify-auth.mjs (see README).

let cachedToken: { value: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 30_000) return cachedToken.value
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization:
        'Basic ' +
        Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: process.env.SPOTIFY_REFRESH_TOKEN ?? '',
    }),
  })
  if (!res.ok) throw new Error(`token refresh failed: ${res.status}`)
  const json = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 }
  return json.access_token
}

async function spotifyGet(token: string, path: string): Promise<any | null> {
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 204 || !res.ok) return null
  return res.json()
}

function simplifyTrack(t: any) {
  if (!t) return null
  return {
    title: t.name,
    artist: (t.artists ?? []).map((a: any) => a.name).join(', '),
    image: t.album?.images?.at(-1)?.url ?? null,
    url: t.external_urls?.spotify ?? null,
  }
}

export default async function handler(_req: any, res: any) {
  try {
    const token = await getAccessToken()
    const [current, recent, top] = await Promise.all([
      spotifyGet(token, '/me/player/currently-playing'),
      spotifyGet(token, '/me/player/recently-played?limit=1'),
      spotifyGet(token, '/me/top/artists?time_range=medium_term&limit=8'),
    ])
    const nowPlaying = current?.is_playing ? simplifyTrack(current.item) : null
    const lastPlayed = simplifyTrack(recent?.items?.[0]?.track)
    const topArtists = (top?.items ?? []).map((a: any) => ({
      name: a.name,
      url: a.external_urls?.spotify ?? null,
      image: a.images?.at(-1)?.url ?? null,
    }))
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    res.status(200).json({ nowPlaying, lastPlayed, topArtists })
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? 'unknown' })
  }
}
