import { useState, type FormEvent } from 'react'

type Status = 'idle' | 'sending' | 'sent' | 'mailto'

// The contact form inside the message-in-a-bottle panel. Tries /api/bottle
// (Resend-backed Vercel function); if that isn't configured it falls back to
// opening the visitor's mail app with the message prefilled.
export function BottlePanel() {
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [from, setFrom] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    const msg = message.trim()
    if (!msg || status === 'sending') return
    setStatus('sending')
    const res = await fetch('/api/bottle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: from.trim(), message: msg, website: '' }),
    }).catch(() => null)
    if (res?.ok) {
      setStatus('sent')
    } else {
      // no serverless function (or it failed) — hand off to the mail app
      const body = msg + (from.trim() ? `\n\n— ${from.trim()}` : '')
      window.location.href = `mailto:davidcui824@gmail.com?subject=${encodeURIComponent(
        'A bottle washed ashore',
      )}&body=${encodeURIComponent(body)}`
      setStatus('mailto')
    }
  }

  if (status === 'sent') {
    return (
      <div className="bottle-sent">
        <span className="bottle-sent-emoji">🌊</span>
        <p>
          Your bottle is drifting toward David.
          <br />
          He reads everything the tide brings in.
        </p>
      </div>
    )
  }

  return (
    <form className="bottle-form" onSubmit={submit}>
      <p className="panel-intro">
        An empty bottle, a scrap of paper. Write something — a hello, a job, a restaurant
        recommendation — and throw it into the sea.
      </p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Dear David…"
        rows={5}
        maxLength={2000}
        required
      />
      <input
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        placeholder="who's it from? email or name (optional)"
        maxLength={200}
      />
      {/* honeypot — humans never see this */}
      <input className="bottle-hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button type="submit" disabled={status === 'sending' || !message.trim()}>
        {status === 'sending' ? 'corking the bottle…' : 'throw it into the sea 🌊'}
      </button>
      {status === 'mailto' && (
        <p className="panel-intro">Opened your mail app instead — hit send there and it'll reach him.</p>
      )}
    </form>
  )
}
