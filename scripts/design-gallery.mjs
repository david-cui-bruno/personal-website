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
  cat: '1.1,1.25,16.2,0,0.75,18.2',
  water: '0,1.7,23,-4.5,0.1,16.5',
  palm: '12.5,6.5,-11,5.7,3.6,-4.1',
  beacon: '4.5,2.2,18,2.9,1.1,15.6',
}

// the sunset anchor hour for most shots
const SUNSET = 'time=19.25'

const SECTIONS = [
  {
    key: 'palette',
    title: '1 · Cotton-candy palette',
    blurb: 'Refinements of the sunset moment — water, sand, grass, and sky tint move together.',
    cam: 'hero',
    extra: SUNSET,
    opts: [
      ['c1', 'Original', 'The cotton candy you picked — unchanged reference.'],
      ['c2', 'Peach lilac', 'Warmer sand, lighter lavender water, peachy sky.'],
      ['c3', 'Berry cream', 'Deeper berry-blue water, magenta-leaning sky.'],
      ['c4', 'Pastel milk', 'Everything lighter and milkier — softest option.'],
    ],
  },
  {
    key: 'water',
    title: '2 · Toon-band water',
    blurb: 'All variants now have mottling texture + wobbling band shapes. Judged at sunset.',
    cam: 'water',
    extra: SUNSET,
    opts: [
      ['b1', '3 bands · crisp', 'Your pick from round one, now textured.'],
      ['b2', '4 bands · soft', 'More steps, softer edges — halfway to a gradient.'],
      ['b3', '2 bands · contour', 'Chunky two-tone with foam lines tracing the boundary.'],
      ['b4', '3 bands · contour + sparkle', 'Foam contours plus glinting sparkles.'],
      ['a', 'Soft gradient', 'The non-toon reference, for comparison.'],
    ],
  },
  {
    key: 'tree',
    title: '3 · Trees',
    blurb: 'Five silhouettes, shot at golden hour. Changes every tree on the island.',
    cam: 'palm',
    extra: 'time=17.75',
    opts: [
      ['a', 'Classic palm', 'The current 9-frond design.'],
      ['b', 'Layered lush', 'Two tiers — long droopers below, short upswept above.'],
      ['c', 'Fan palm', 'Tall, straighter trunk, upright fan of narrow fronds.'],
      ['d', 'Round canopy', 'Not a palm — clustered leaf blobs, storybook tree.'],
      ['e', 'Leaning coconut', 'Strong postcard lean with long sparse fronds.'],
    ],
  },
  {
    key: 'cat',
    title: '4 · Bebo colorways',
    blurb: 'Face-on at midday for true colors.',
    cam: 'cat',
    extra: 'time=12',
    opts: [
      ['a', 'Brown tabby', 'Current. Warm brown, green eyes.'],
      ['b', 'Grey tabby', 'Classic grey, amber eyes.'],
      ['c', 'Orange tabby', 'Marmalade menace.'],
      ['d', 'Tuxedo black', 'Near-black, white belly + paws, yellow eyes.'],
    ],
  },
  {
    key: 'beacon',
    title: '5 · Beacons',
    blurb: 'Shot at dusk, when they matter most.',
    cam: 'beacon',
    extra: 'time=20.75',
    opts: [
      ['a', 'Gold diamond', 'Current spinning octahedron.'],
      ['b', 'Light beam', 'Soft pillar of light + small diamond.'],
      ['c', 'Glow orb', 'Round bobbing firefly glow.'],
    ],
  },
]

const CLOCK = [
  ['6.75', 'Dawn'],
  ['12', 'Midday'],
  ['17.75', 'Golden hour'],
  ['19.25', 'Sunset (the signature)'],
  ['20.75', 'Dusk'],
  ['23', 'Night'],
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

for (const [h] of CLOCK) {
  await shoot(page, `time=${h}`, 'hero', `clock-${h.replace('.', '_')}`)
}
for (const sec of SECTIONS) {
  for (const [val] of sec.opts) {
    await shoot(page, `${sec.key}=${val}&${sec.extra}`, sec.cam, `${sec.key}-${val}`)
  }
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
      <input type="radio" name="${sec.key}" value="${val}" ${val === sec.opts[0][0] ? 'checked' : ''}>
      <img src="img/${sec.key}-${val}.jpg" alt="${label}" loading="lazy">
      <div class="meta">
        <b>${val.toUpperCase()} — ${label}</b>
        <span>${note}</span>
        <a href="${LIVE}/?${sec.key}=${val}&${sec.extra}&autostart" target="_blank">try it live ↗</a>
      </div>
    </label>`,
      )
      .join('')}
  </div>
</section>`

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>David's Island — design round 2</title>
<style>
  :root { --paper:#fdf6e9; --ink:#4a3b2c; --soft:#756043; --accent:#e07a3f; }
  * { box-sizing: border-box; margin: 0; }
  body { font-family: ui-rounded,'SF Pro Rounded',system-ui,sans-serif; background:#f6e9d2; color:var(--ink); padding: 40px 5vw 140px; }
  h1 { font-size: 34px; } .sub { color: var(--soft); margin: 6px 0 30px; max-width: 660px; line-height:1.5; }
  h2 { font-size: 22px; margin: 44px 0 4px; }
  .blurb { color: var(--soft); margin-bottom: 14px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
  .clock-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
  .clock-grid figure { background: var(--paper); border-radius: 14px; overflow: hidden; box-shadow: 0 6px 18px rgba(80,45,15,.12); }
  .clock-grid img { width: 100%; display: block; aspect-ratio: 16/9; object-fit: cover; }
  .clock-grid figcaption { padding: 8px 12px; font-size: 13px; font-weight: 700; }
  .card { display: block; background: var(--paper); border-radius: 16px; overflow: hidden; cursor: pointer; border: 3px solid transparent; box-shadow: 0 8px 24px rgba(80,45,15,.12); position: relative; }
  .card:has(input:checked) { border-color: var(--accent); }
  .card input { position: absolute; top: 10px; left: 10px; transform: scale(1.4); accent-color: var(--accent); }
  .card img { width: 100%; display: block; aspect-ratio: 16/9; object-fit: cover; }
  .meta { padding: 12px 14px 14px; display: grid; gap: 4px; }
  .meta b { font-size: 15px; } .meta span { font-size: 13px; color: var(--soft); }
  .meta a { font-size: 12.5px; color: var(--accent); font-weight: 700; text-decoration: none; }
  .bar { position: fixed; left: 0; right: 0; bottom: 0; background: var(--paper); box-shadow: 0 -8px 30px rgba(80,45,15,.18); padding: 14px 5vw; display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
  .bar button { background: var(--accent); color: #fff; border: 0; border-radius: 999px; padding: 11px 22px; font: inherit; font-weight: 700; cursor: pointer; }
  #picks { font-family: ui-monospace, monospace; font-size: 14px; background: #f1e4c8; padding: 8px 14px; border-radius: 10px; word-break: break-all; }
  @media (max-width: 640px) {
    body { padding: 24px 16px 150px; }
    h1 { font-size: 26px; }
    h2 { font-size: 19px; margin-top: 34px; }
    .grid { grid-template-columns: 1fr; gap: 14px; }
    .clock-grid { grid-template-columns: 1fr 1fr; }
    .card input { transform: scale(1.7); top: 14px; left: 14px; }
    .meta a { padding: 6px 0; display: inline-block; }
    .bar { padding: 12px 16px; gap: 10px; }
    .bar span { display: none; }
  }
</style></head>
<body>
  <h1>🏝️ Design round 2</h1>
  <p class="sub">New this round: the island now follows the visitor's <b>local clock</b> (strip below), the island is <b>~18% smaller</b>, grass got patchy texture + flowers, and the water bands wobble and mottle. Pick one option per section, hit "copy my picks", and send the string to Claude. Every card links to a live preview.</p>

  <section>
    <h2>0 · A day on the island</h2>
    <p class="blurb">Not a choice — this ships. The look blends smoothly through these moments based on the visitor's local time (cotton-candy sunset is the signature). Preview any hour live with <b>?time=19.25</b> etc.</p>
    <div class="clock-grid">
      ${CLOCK.map(
        ([h, label]) => `
      <figure>
        <a href="${LIVE}/?time=${h}&autostart" target="_blank"><img src="img/clock-${h.replace('.', '_')}.jpg" alt="${label}"></a>
        <figcaption>${label} · ${h}h</figcaption>
      </figure>`,
      ).join('')}
    </div>
  </section>

  ${SECTIONS.map(section).join('')}

  <div class="bar">
    <button onclick="update();navigator.clipboard&&navigator.clipboard.writeText(document.getElementById('picks').textContent)">copy my picks</button>
    <code id="picks">palette=c1 water=b1 tree=a cat=a beacon=a</code>
    <span style="color:var(--soft);font-size:13px">— send that string (or just say it) to Claude</span>
  </div>
  <script>
    function update() {
      const keys = ['palette','water','tree','cat','beacon']
      document.getElementById('picks').textContent = keys.map(k => k + '=' + (document.querySelector('input[name='+k+']:checked')?.value ?? '?')).join(' ')
    }
    document.addEventListener('change', update)
  </script>
</body></html>`

writeFileSync(`${OUT}/index.html`, html)
console.log(`\nwrote ${OUT}/index.html`)
