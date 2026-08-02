// Vercel serverless function: /api/bottle
// Receives message-in-a-bottle submissions and emails them to David.
// Optional env var: RESEND_API_KEY (resend.com — free tier is plenty).
// Without it this returns 501 and the client falls back to a mailto link.

// Sends from the Resend account's verified domain (send.framewisehealth.com),
// which allows delivery to any recipient. Override the recipient with the
// BOTTLE_TO env var if it should ever change.
const FROM = "David's Island <island@send.framewisehealth.com>"
const TO = process.env.BOTTLE_TO ?? 'davidcui824@gmail.com'

// naive per-instance rate limit: one bottle per IP per 20s. Weak (per-lambda
// memory) but enough to keep a stuck retry loop or lazy bot off the Resend quota.
const lastSent = new Map<string, number>()
function rateLimited(ip: string): boolean {
  const now = Date.now()
  const last = lastSent.get(ip) ?? 0
  if (now - last < 20_000) return true
  if (lastSent.size > 500) lastSent.clear()
  lastSent.set(ip, now)
  return false
}

export default async function handler(req: any, res: any) {
  try {
    await handle(req, res)
  } catch {
    // malformed body, Resend/network failure — never crash the function
    if (!res.headersSent) res.status(502).json({ error: 'send failed' })
  }
}

async function handle(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' })
    return
  }
  // only accept browser submissions from the site itself (whatever domain it's
  // served from) — blocks cross-site posts without hardcoding a domain
  const origin = String(req.headers.origin ?? req.headers.referer ?? '')
  const host = String(req.headers.host ?? '')
  if (origin && host && !origin.includes(host)) {
    res.status(403).json({ error: 'forbidden' })
    return
  }
  const { from = '', message = '', website = '' } = req.body ?? {}
  if (website) {
    // honeypot tripped — pretend it worked
    res.status(200).json({ ok: true })
    return
  }
  const msg = String(message).slice(0, 2000).trim()
  if (!msg) {
    res.status(400).json({ error: 'empty message' })
    return
  }
  const ip = String(req.headers['x-forwarded-for'] ?? 'unknown').split(',')[0].trim()
  if (rateLimited(ip)) {
    res.status(429).json({ error: 'slow down' })
    return
  }
  const key = process.env.RESEND_API_KEY
  if (!key) {
    res.status(501).json({ error: 'not configured' })
    return
  }
  const sender = String(from).slice(0, 200).trim()
  // if the visitor left an email address, wire it as reply-to
  const replyTo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender) ? sender : undefined
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject: '🍾 A bottle washed ashore',
      text: msg + (sender ? `\n\n— from: ${sender}` : '\n\n— unsigned'),
    }),
  })
  if (!r.ok) {
    res.status(502).json({ error: 'send failed' })
    return
  }
  res.status(200).json({ ok: true })
}
