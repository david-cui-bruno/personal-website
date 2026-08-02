import type { ReactNode } from 'react'
import { MusicLive } from '../ui/MusicLive'
import { BottlePanel } from '../ui/BottlePanel'

// ---------------------------------------------------------------------------
// Everything a visitor can read lives in this file. Search for TODO to find
// the spots waiting on David's real content.
// ---------------------------------------------------------------------------

export interface IslandItem {
  id: string
  title: string
  emoji: string
  /** where it sits on the island (x, z) — y comes from the terrain */
  position: [number, number]
  /** how close the cat must be to interact */
  interactRadius: number
  /** movement blocker radius (0 = walkable through) */
  colliderRadius: number
}

export const ITEMS: IslandItem[] = [
  { id: 'projects', title: 'Treasure Chest', emoji: '📦', position: [-13, 8], interactRadius: 2.6, colliderRadius: 0.9 },
  { id: 'framewise', title: 'First-Aid Kit', emoji: '🩹', position: [3.5, 19], interactRadius: 2.4, colliderRadius: 0.55 },
  { id: 'music', title: 'Beach Speaker', emoji: '🔊', position: [-15, -8], interactRadius: 2.8, colliderRadius: 1.4 },
  { id: 'food', title: 'Campfire', emoji: '🍳', position: [9, -13], interactRadius: 2.8, colliderRadius: 1.2 },
  { id: 'bottle', title: 'Message in a Bottle', emoji: '🍾', position: [-6, 20.5], interactRadius: 2.4, colliderRadius: 0.35 },
  { id: 'journal', title: 'Journal', emoji: '📖', position: [8.7, -2.6], interactRadius: 2.4, colliderRadius: 0.35 },
]

// Palm placement — the hero palm crowns the dune, three smaller ones dot the island.
export const PALMS = [
  { x: 7, z: -5, scale: 1, rotY: 0.4, swayPhase: 0, hero: true },
  { x: -8, z: -14, scale: 0.62, rotY: 2.1, swayPhase: 1.7 },
  { x: 14, z: 3.5, scale: 0.58, rotY: 4.2, swayPhase: 3.1 },
  { x: -2.5, z: -10, scale: 0.7, rotY: 5.5, swayPhase: 4.6 },
] as const

// Static obstacles that block walking.
export const EXTRA_COLLIDERS: { x: number; z: number; r: number }[] = PALMS.map((p) => ({
  x: p.x,
  z: p.z,
  r: 0.35 + p.scale * 0.45,
}))

interface Project {
  name: string
  blurb: string
  url: string
  tags: string[]
}

const PROJECTS: Project[] = [
  {
    name: "Bruno's Dictionary",
    blurb: "Brown University's slang dictionary — the web app plus its mobile companion.",
    url: 'https://github.com/david-cui-bruno/brunos-dictionary-v2',
    tags: ['TypeScript', 'Full-stack'],
  },
  {
    name: 'incluDS',
    blurb: 'Resource platform for people with Down syndrome — site, backend, and a Chrome extension.',
    url: 'https://github.com/david-cui-bruno/incluDS-ts',
    tags: ['TypeScript', 'Accessibility'],
  },
  {
    name: 'PetPen',
    blurb: "San Mateo Health's pet-fostering program for hospitalized patients who have nowhere to leave their pets.",
    url: 'https://github.com/david-cui-bruno/petpen',
    tags: ['TypeScript', 'Health'],
  },
  {
    name: 'Pokémon TCG Pocket RL',
    blurb: 'A reinforcement-learning agent that teaches itself the card game.',
    url: 'https://github.com/david-cui-bruno/pokemontcgpocketRL',
    tags: ['Python', 'RL'],
  },
  {
    name: 'Flashcarding',
    blurb: 'Turns documents and long lists of facts into flashcards.',
    url: 'https://github.com/david-cui-bruno/flashcarding',
    tags: ['TypeScript', 'AI'],
  },
  {
    name: 'Photobooth',
    blurb: 'A photo booth + photo editor that lives in the browser :>',
    url: 'https://github.com/david-cui-bruno/photobooth',
    tags: ['TypeScript', 'Creative'],
  },
  {
    name: 'This island',
    blurb: "The one you're standing on. React Three Fiber, a hand-built shader ocean, and a procedural cat.",
    url: 'https://github.com/david-cui-bruno/personal-website',
    tags: ['Three.js', 'R3F'],
  },
]

// TODO(David): drop in your playlist/artist/track IDs and embeds will appear
// in the music panel. Grab an ID from any Spotify share link:
// open.spotify.com/playlist/<ID>?...
const SPOTIFY = {
  playlists: [] as string[],
  artists: [] as string[],
  tracks: [] as string[],
}

const BELI_URL = 'https://beliapp.co/app/sourdog'

function SpotifyEmbed({ type, id, compact }: { type: string; id: string; compact?: boolean }) {
  // Accept either a bare ID or a full share link (open.spotify.com/<type>/<id>?...).
  const cleanId = id.includes('/') ? (id.split('?')[0].split('/').pop() ?? id) : id
  return (
    <iframe
      title={`Spotify ${type} player`}
      src={`https://open.spotify.com/embed/${type}/${cleanId}?theme=0`}
      width="100%"
      height={compact ? 152 : 352}
      frameBorder="0"
      loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      style={{ borderRadius: 12 }}
    />
  )
}

export const PANEL_CONTENT: Record<string, { heading: string; body: ReactNode }> = {
  projects: {
    heading: 'Things David built',
    body: (
      <>
        <p className="panel-intro">
          A chest of projects washed ashore. The salt water didn't hurt them — they're all on GitHub.
        </p>
        <ul className="project-list">
          {PROJECTS.map((p) => (
            <li key={p.name}>
              <a href={p.url} target="_blank" rel="noreferrer">
                <span className="project-name">{p.name} ↗</span>
                <span className="project-blurb">{p.blurb}</span>
                <span className="project-tags">
                  {p.tags.map((t) => (
                    <em key={t}>{t}</em>
                  ))}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </>
    ),
  },

  framewise: {
    heading: 'Framewise Health',
    body: (
      <>
        <p className="panel-intro">
          A first-aid kit — of course he'd bring one. David co-founded{' '}
          <strong>Framewise Health</strong>, a Y&nbsp;Combinator-backed healthcare company.
        </p>
        <p>Framewise built software for clinics: a patient-facing mobile app and a physician CRM.</p>
        <p>
          <a href="https://github.com/david-cui-bruno/framewise-mobile" target="_blank" rel="noreferrer">
            patient app ↗
          </a>{' '}
          ·{' '}
          <a href="https://github.com/david-cui-bruno/framewise-health-physician" target="_blank" rel="noreferrer">
            physician CRM ↗
          </a>
        </p>
      </>
    ),
  },

  music: {
    heading: 'What the speaker plays',
    body: (
      <>
        <p className="panel-intro">
          A beach needs a soundtrack. The speaker syncs with David's Spotify — whatever he's playing,
          it's playing.
        </p>
        <MusicLive />
        {SPOTIFY.playlists.map((id) => (
          <SpotifyEmbed key={id} type="playlist" id={id} />
        ))}
        {SPOTIFY.artists.map((id) => (
          <SpotifyEmbed key={id} type="artist" id={id} />
        ))}
        {SPOTIFY.tracks.map((id) => (
          <SpotifyEmbed key={id} type="track" id={id} compact />
        ))}
      </>
    ),
  },

  food: {
    heading: 'The important stuff',
    body: (
      <>
        <p className="panel-intro">
          If David were stranded here, he'd survive — food runs in the family.
        </p>
        <h3>The family restaurant</h3>
        <p>
          His dad runs{' '}
          <a href="https://swampcafedallas.com" target="_blank" rel="noreferrer">
            Swamp Cafe ↗
          </a>{' '}
          in Dallas. Go eat there.
        </p>
        <h3>Where he's eaten</h3>
        {BELI_URL ? (
          <p>
            Every meal gets rated on{' '}
            <a href={BELI_URL} target="_blank" rel="noreferrer">
              Beli ↗
            </a>
            .
          </p>
        ) : (
          <p>Every meal gets rated on Beli.</p>
        )}
        <h3>Dishes he'd defend with his life</h3>
        <ul>
          <li>Soba</li>
          <li>Black tea (it counts)</li>
          <li>Hóng shāo ròu — 红烧肉</li>
        </ul>
      </>
    ),
  },

  bottle: {
    heading: 'Say hi',
    body: <BottlePanel />,
  },

  journal: {
    heading: 'Field notes',
    body: (
      <>
        <p className="panel-intro">A notebook washed ashore, mostly intact. The legible pages:</p>
        <p>
          David Cui — builder. Co-founded <strong>Framewise Health</strong> (YC). Cooks, rates every
          meal, currently supervised by a tabby named Bebo.
        </p>
        <p>
          <a href="https://github.com/david-cui-bruno" target="_blank" rel="noreferrer">
            GitHub ↗
          </a>{' '}
          ·{' '}
          <a href="mailto:davidcui824@gmail.com">email</a>
        </p>
        <p className="panel-intro">
          Want to say hi properly? There's an empty bottle down at the waterline.
        </p>
      </>
    ),
  },
}
