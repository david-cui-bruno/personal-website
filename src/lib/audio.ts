// Procedural ambient audio — no audio files, everything synthesized:
//  - surf: looped brown noise → lowpass, slowly swelling (LFO on gain)
//  - campfire: bandpassed noise with random crackle pops + a warm low rumble
// Volumes are driven from the game loop (louder fire near the campfire,
// louder surf near the waterline). Master gain handles mute.

const MUTE_KEY = 'davids-island-muted'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let surfGain: GainNode | null = null
let fireGain: GainNode | null = null
let crackleGain: GainNode | null = null
let crackleTimer: ReturnType<typeof setInterval> | null = null

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

function makeNoiseBuffer(ac: AudioContext, seconds = 4): AudioBuffer {
  const buf = ac.createBuffer(1, ac.sampleRate * seconds, ac.sampleRate)
  const data = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1
    // brown-ish noise: integrate white noise
    last = (last + 0.02 * white) / 1.02
    data[i] = last * 3.5
  }
  return buf
}

export function startAudio() {
  if (ctx) return
  const AC: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return
  ctx = new AC()
  // iOS Safari can hand out an already-suspended context even inside a gesture
  void ctx.resume()
  master = ctx.createGain()
  master.gain.value = isMuted() ? 0 : 0.55
  master.connect(ctx.destination)

  const noise = makeNoiseBuffer(ctx)

  // ---- surf
  const surfSrc = ctx.createBufferSource()
  surfSrc.buffer = noise
  surfSrc.loop = true
  const surfLP = ctx.createBiquadFilter()
  surfLP.type = 'lowpass'
  surfLP.frequency.value = 480
  surfGain = ctx.createGain()
  surfGain.gain.value = 0.4
  surfSrc.connect(surfLP).connect(surfGain).connect(master)
  surfSrc.start()
  // slow swell
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.09
  const lfoDepth = ctx.createGain()
  lfoDepth.gain.value = 0.16
  lfo.connect(lfoDepth).connect(surfGain.gain)
  lfo.start()

  // ---- campfire
  fireGain = ctx.createGain()
  fireGain.gain.value = 0
  fireGain.connect(master)
  // warm rumble base
  const rumbleSrc = ctx.createBufferSource()
  rumbleSrc.buffer = noise
  rumbleSrc.loop = true
  rumbleSrc.playbackRate.value = 0.7
  const rumbleLP = ctx.createBiquadFilter()
  rumbleLP.type = 'lowpass'
  rumbleLP.frequency.value = 240
  const rumbleGain = ctx.createGain()
  rumbleGain.gain.value = 0.25
  rumbleSrc.connect(rumbleLP).connect(rumbleGain).connect(fireGain)
  rumbleSrc.start()
  // crackle pops
  const crackleSrc = ctx.createBufferSource()
  crackleSrc.buffer = noise
  crackleSrc.loop = true
  crackleSrc.playbackRate.value = 1.6
  const crackleBP = ctx.createBiquadFilter()
  crackleBP.type = 'bandpass'
  crackleBP.frequency.value = 1900
  crackleBP.Q.value = 1.1
  crackleGain = ctx.createGain()
  crackleGain.gain.value = 0.04
  crackleSrc.connect(crackleBP).connect(crackleGain).connect(fireGain)
  crackleSrc.start()
  crackleTimer = setInterval(() => {
    // no-op while suspended/muted so gain-automation events don't pile up
    if (!ctx || ctx.state !== 'running' || !crackleGain) return
    if (Math.random() < 0.34) {
      const t = ctx.currentTime
      crackleGain.gain.setTargetAtTime(0.35 + Math.random() * 0.5, t, 0.004)
      crackleGain.gain.setTargetAtTime(0.04, t + 0.02, 0.035)
    }
  }, 70)

  // save battery when the tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return
    if (document.hidden) void ctx.suspend()
    else if (!isMuted()) void ctx.resume()
  })
}

export function setMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
  } catch {
    /* private mode */
  }
  if (!ctx) {
    if (!muted) startAudio()
    return
  }
  if (master) master.gain.setTargetAtTime(muted ? 0 : 0.55, ctx.currentTime, 0.08)
  if (muted) {
    // fully suspend after the fade so a muted tab burns no audio cycles
    const c = ctx
    setTimeout(() => {
      if (isMuted()) void c.suspend()
    }, 300)
  } else if (ctx.state === 'suspended') {
    void ctx.resume()
  }
}

/** Called from the game loop: surf ∈ [0,1]-ish, fire ∈ [0,1]. */
export function setAudioLevels(surf: number, fire: number) {
  if (!ctx || !surfGain || !fireGain) return
  const t = ctx.currentTime
  surfGain.gain.setTargetAtTime(0.15 + surf * 0.45, t, 0.25)
  fireGain.gain.setTargetAtTime(fire, t, 0.2)
}

export function stopAudio() {
  if (crackleTimer) clearInterval(crackleTimer)
  crackleTimer = null
  void ctx?.close()
  ctx = null
}
