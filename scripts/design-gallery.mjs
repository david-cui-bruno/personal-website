#!/usr/bin/env node
// Renders every design variant in-engine and writes design-options/index.html
// for side-by-side evaluation. Run with the dev server up on :5173:
//   node scripts/design-gallery.mjs

import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

const BASE = 'http://localhost:5173'
const LIVE = 'https://personal-website-six-fawn-22.vercel.app'
const OUT = 'design-options'

const CAMS = {
  hero: null, // default follow-cam framing at spawn
  cat: '1.3,1.25,19.8,0,0.75,22.2',
  water: '0,1.7,28,-5,0.1,20',
  palm: '11.5,4.8,0.2,7,3.0,-5',
  beacon: '5.4,2.2,21.8,3.5,1.1,19',
}

const SECTIONS = [
  {
    key: 'mood',
    title: '1 · Mood & lighting',
    blurb: 'The biggest lever — sky, light, fog, water color, and ground palette as one package.',
    cam: 'hero',
    opts: [
      ['a', 'Golden hour', 'The current look. Warm peach, long shadows.'],
      ['b', 'High noon', 'Postcard blues, vivid turquoise, crisp white light.'],
      ['c', 'Cotton-candy sunset', 'Pink sky, lavender-blue deep water, soft and dreamy.'],
      ['d', 'Dusk ember', 'Deep twilight — the campfire and beacons really glow.'],
    ],
  },
  {
    key: 'water',
    title: '2 · Water surface',
    blurb: 'Same colors as the chosen mood — this is about the surface style.',
    cam: 'water',
    opts: [
      ['a', 'Soft gradient', 'The current look. Smooth shallow→deep blend, fine foam flecks.'],
      ['b', 'Toon bands', 'Posterized color steps and bolder, chunkier foam. Most stylized.'],
      ['c', 'Glassy calm', 'More transparent, fewer flecks — serene and quiet.'],
    ],
  },
  {
    key: 'palm',
    title: '3 · Palm trees',
    blurb: 'Crown fullness and silhouette.',
    cam: 'palm',
    opts: [
      ['a', 'Classic', 'The current look. 9 fronds, balanced.'],
      ['b', 'Lush', '13 droopier, wider fronds, fuller crown, deeper green.'],
      ['c', 'Breezy', '7 long thin fronds, taller and lighter — more windswept.'],
    ],
  },
  {
    key: 'cat',
    title: '4 · Bebo colorways',
    blurb: 'All tabby-striped except the tuxedo. Pick whichever is most Bebo.',
    cam: 'cat',
    opts: [
      ['a', 'Brown tabby', 'The current look. Warm brown, green eyes.'],
      ['b', 'Grey tabby', 'Classic grey with slate stripes, amber eyes.'],
      ['c', 'Orange tabby', 'Marmalade menace, amber eyes.'],
      ['d', 'Tuxedo black', 'Near-black with white belly + paws, yellow eyes.'],
    ],
  },
  {
    key: 'beacon',
    title: '5 · Undiscovered-item beacons',
    blurb: 'How unfound items call to you from across the island.',
    cam: 'beacon',
    opts: [
      ['a', 'Gold diamond', 'The current look. Spinning, bobbing octahedron.'],
      ['b', 'Light beam', 'A soft pillar of light with a small diamond on top.'],
      ['c', 'Glow orb', 'A round bobbing glow — softer, firefly-ish.'],
    ],
  },
]

const COMBOS = [
  ['Postcard', 'mood=b&water=c&palm=b', 'High noon + glassy water + lush palms'],
  ['Dream', 'mood=c&water=b&palm=a', 'Cotton-candy sunset + toon water'],
  ['Ember', 'mood=d&water=a&palm=b&beacon=b', 'Dusk + lush palms + light beams'],
]

const HIDE_HUD = '.hud-title,.hud-progress,.hud-mute,.hud-prompt,.hud-interact,.hud-toast,.joystick{display:none!important}'

async function shoot(page, query, cam, file) {
  const camQ = cam && CAMS[cam] ? `&cam=${CAMS[cam]}` : ''
  await page.goto(`${BASE}/?autostart&hq&${query}${camQ}`)
  await page.waitForSelector('canvas', { timeout: 20000 })
  await page.addStyleTag({ content: HIDE_HUD })
  await page.waitForTimeout(3200)
  await page.screenshot({ path: `${OUT}/img/${file}.jpg`, type: 'jpeg', quality: 85 })
  console.log('shot', file)
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
page.on('pageerror', (e) => console.error('PAGEERROR', e.message))
mkdirSync(`${OUT}/img`, { recursive: true })

for (const sec of SECTIONS) {
  for (const [val] of sec.opts) {
    await shoot(page, `${sec.key}=${val}`, sec.cam, `${sec.key}-${val}`)
  }
}
for (let i = 0; i < COMBOS.length; i++) {
  await shoot(page, COMBOS[i][1], 'hero', `combo-${i}`)
}
await browser.close()

// ---------------------------------------------------------------------------

const section = (sec) => `
<section>
  <h2>${sec.title}</h2>
  <p class="blurb">${sec.blurb}</p>
  <div class="grid">
    ${sec.opts
      .map(
        ([val, label, note]) => `
    <label class="card">
      <input type="radio" name="${sec.key}" value="${val}" ${val === 'a' ? 'checked' : ''}>
      <img src="img/${sec.key}-${val}.jpg" alt="${label}" loading="lazy">
      <div class="meta">
        <b>${val.toUpperCase()} — ${label}</b>
        <span>${note}</span>
        <a href="${LIVE}/?${sec.key}=${val}&autostart" target="_blank">try it live ↗</a>
      </div>
    </label>`,
      )
      .join('')}
  </div>
</section>`

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>David's Island — design options</title>
<style>
  :root { --paper:#fdf6e9; --ink:#4a3b2c; --soft:#756043; --accent:#e07a3f; }
  * { box-sizing: border-box; margin: 0; }
  body { font-family: ui-rounded,'SF Pro Rounded',system-ui,sans-serif; background:#f6e9d2; color:var(--ink); padding: 40px 5vw 140px; }
  h1 { font-size: 34px; } .sub { color: var(--soft); margin: 6px 0 30px; max-width: 640px; line-height:1.5; }
  h2 { font-size: 22px; margin: 44px 0 4px; }
  .blurb { color: var(--soft); margin-bottom: 14px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
  .card { display: block; background: var(--paper); border-radius: 16px; overflow: hidden; cursor: pointer; border: 3px solid transparent; box-shadow: 0 8px 24px rgba(80,45,15,.12); position: relative; }
  .card:has(input:checked) { border-color: var(--accent); }
  .card input { position: absolute; top: 10px; left: 10px; transform: scale(1.4); accent-color: var(--accent); }
  .card img { width: 100%; display: block; aspect-ratio: 16/9; object-fit: cover; }
  .meta { padding: 12px 14px 14px; display: grid; gap: 4px; }
  .meta b { font-size: 15px; } .meta span { font-size: 13px; color: var(--soft); }
  .meta a { font-size: 12.5px; color: var(--accent); font-weight: 700; text-decoration: none; }
  .combos .card { pointer-events: auto; }
  .bar { position: fixed; left: 0; right: 0; bottom: 0; background: var(--paper); box-shadow: 0 -8px 30px rgba(80,45,15,.18); padding: 14px 5vw; display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
  .bar button { background: var(--accent); color: #fff; border: 0; border-radius: 999px; padding: 11px 22px; font: inherit; font-weight: 700; cursor: pointer; }
  #picks { font-family: ui-monospace, monospace; font-size: 14px; background: #f1e4c8; padding: 8px 14px; border-radius: 10px; word-break: break-all; }
  @media (max-width: 640px) {
    body { padding: 24px 16px 150px; }
    h1 { font-size: 26px; }
    h2 { font-size: 19px; margin-top: 34px; }
    .grid { grid-template-columns: 1fr; gap: 14px; }
    .card input { transform: scale(1.7); top: 14px; left: 14px; }
    .meta a { padding: 6px 0; display: inline-block; }
    .bar { padding: 12px 16px; gap: 10px; }
    .bar span { display: none; }
  }
</style></head>
<body>
  <h1>🏝️ Design options</h1>
  <p class="sub">Each image is rendered in-engine — what you pick is exactly what ships. Select one option per section (A = what's live today), then copy the pick string at the bottom and send it to Claude. Every card also has a live link so you can feel it in motion.</p>
  ${SECTIONS.map(section).join('')}
  <section class="combos">
    <h2>Curated combos</h2>
    <p class="blurb">A few packages to calibrate against — click through to walk around in them.</p>
    <div class="grid">
      ${COMBOS.map(
        ([label, q, note], i) => `
      <a class="card" href="${LIVE}/?${q}&autostart" target="_blank" style="text-decoration:none;color:inherit">
        <img src="img/combo-${i}.jpg" alt="${label}" loading="lazy">
        <div class="meta"><b>${label}</b><span>${note}</span><span style="color:var(--accent);font-weight:700">walk around in it ↗</span></div>
      </a>`,
      ).join('')}
    </div>
  </section>
  <div class="bar">
    <button onclick="update();navigator.clipboard&&navigator.clipboard.writeText(document.getElementById('picks').textContent)">copy my picks</button>
    <code id="picks">mood=a water=a palm=a cat=a beacon=a</code>
    <span style="color:var(--soft);font-size:13px">— send that string (or just say it) to Claude</span>
  </div>
  <script>
    function update() {
      const keys = ['mood','water','palm','cat','beacon']
      document.getElementById('picks').textContent = keys.map(k => k + '=' + (document.querySelector('input[name='+k+']:checked')?.value ?? 'a')).join(' ')
    }
    document.addEventListener('change', update)
  </script>
</body></html>`

writeFileSync(`${OUT}/index.html`, html)
console.log(`\nwrote ${OUT}/index.html`)
