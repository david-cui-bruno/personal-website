# David's Island 🏝️

Personal site as a tiny open world: you wash ashore on a deserted island as a tabby cat and
discover the things David would bring with him — each one opens a piece of his portfolio.

Everything is procedural (terrain, water shader, palms, the cat) — no 3D asset files, no downloads.

## Stack

Vite · React 19 · TypeScript · three.js 0.185 · React Three Fiber 9 · drei ·
@react-three/postprocessing · three-custom-shader-material · zustand.
No physics engine — movement is an analytic heightfield sample + circle colliders.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build to dist/
```

## Where things live

| What | Where |
|---|---|
| All visitor-readable content (projects, Framewise, music, food) + item placement | `src/config/content.tsx` — search `TODO` |
| Colors, including the cat's tabby palette | `src/config/palette.ts` |
| Island shape (one function drives mesh, walking, and placement) | `src/lib/terrain.ts` |
| Water + shoreline-foam shaders | `src/scene/Water.tsx`, `src/scene/Terrain.tsx` |
| The cat: model + gait + movement + camera | `src/scene/PlayerCat.tsx` |
| Discoverable items (chest / med kit / speaker / campfire) | `src/scene/items/` |
| Overlay UI (intro, HUD, panels, touch joystick) | `src/ui/` |

Controls: WASD to walk, drag to orbit, scroll to zoom, `E` to interact, Shift to trot.
On touch devices: joystick bottom-left, tap the button to interact.

Discovery progress persists in `localStorage` (`davids-island-discovered-v1`).

## Spotify "now playing" (the beach speaker)

The music panel shows a live now-playing / last-played card + top artists via one Vercel
serverless function (`api/spotify.ts`). One-time setup:

1. Create an app at <https://developer.spotify.com/dashboard> (account needs Premium).
   Add **exactly** this redirect URI: `http://127.0.0.1:8877/callback` (must be `127.0.0.1`, not `localhost`).
2. Run `SPOTIFY_CLIENT_ID=… SPOTIFY_CLIENT_SECRET=… node scripts/spotify-auth.mjs`,
   approve in the browser, copy the printed `SPOTIFY_REFRESH_TOKEN`.
3. Add `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` in
   Vercel → Project → Settings → Environment Variables and redeploy.

The panel hides the live section gracefully when the function isn't configured (e.g. `npm run dev`);
use `vercel dev` to test it locally. Responses are edge-cached
(`s-maxage=60, stale-while-revalidate=300`) so traffic never hammers the Spotify API.

Playlist/artist/track embeds: add IDs in `src/config/content.tsx` (`SPOTIFY` object).
