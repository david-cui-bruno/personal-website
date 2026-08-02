import { useEffect, useState } from 'react'

interface Track {
  title: string
  artist: string
  image: string | null
  url: string | null
}

interface Album {
  name: string
  artist: string
  image: string | null
  url: string | null
}

interface SpotifyData {
  nowPlaying: Track | null
  lastPlayed: Track | null
  topArtists: { name: string; url: string | null; image: string | null }[]
  topAlbums?: Album[]
}

// Live "now playing" from /api/spotify (Vercel function). Renders nothing
// until data arrives, and nothing at all if the endpoint isn't set up —
// the panel works fine without it (e.g. local dev).
export function MusicLive() {
  const [data, setData] = useState<SpotifyData | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/api/spotify')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: SpotifyData) => {
        if (alive && (d.nowPlaying || d.lastPlayed || d.topArtists?.length || d.topAlbums?.length)) setData(d)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  if (!data) return null
  const track = data.nowPlaying ?? data.lastPlayed
  const live = Boolean(data.nowPlaying)

  return (
    <div className="music-live">
      {track && (
        <a className="np-card" href={track.url ?? undefined} target="_blank" rel="noreferrer">
          {track.image && <img src={track.image} alt="" width={48} height={48} />}
          <span className="np-text">
            <span className={live ? 'np-label np-label-live' : 'np-label'}>
              {live ? '● now playing' : 'last played'}
            </span>
            <b>{track.title}</b>
            <span className="np-artist">{track.artist}</span>
          </span>
        </a>
      )}
      {(data.topAlbums?.length ?? 0) > 0 && (
        <>
          <h3>Albums on repeat lately</h3>
          <div className="album-grid">
            {data.topAlbums!.map((a) => (
              <a key={a.name + a.artist} href={a.url ?? undefined} target="_blank" rel="noreferrer" className="album-card">
                {a.image && <img src={a.image} alt="" loading="lazy" />}
                <b>{a.name}</b>
                <span>{a.artist}</span>
              </a>
            ))}
          </div>
        </>
      )}
      {data.topArtists.length > 0 && (
        <>
          <h3>On repeat</h3>
          <div className="artist-chips">
            {data.topArtists.map((a) => (
              <a key={a.name} href={a.url ?? undefined} target="_blank" rel="noreferrer">
                {a.image && <img src={a.image} alt="" width={22} height={22} />}
                {a.name}
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
