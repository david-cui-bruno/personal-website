#!/usr/bin/env node
// One-time Spotify authorization helper. Prints the SPOTIFY_REFRESH_TOKEN the
// /api/spotify function needs.
//
// Usage:
//   1. Create an app at https://developer.spotify.com/dashboard (owner account
//      needs Premium). Add EXACTLY this redirect URI to the app settings:
//      http://127.0.0.1:8877/callback     (must be 127.0.0.1, NOT localhost)
//   2. SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=... node scripts/spotify-auth.mjs
//   3. Approve in the browser tab that opens; copy the printed refresh token.

import http from 'node:http'
import { exec } from 'node:child_process'

const id = process.env.SPOTIFY_CLIENT_ID
const secret = process.env.SPOTIFY_CLIENT_SECRET
if (!id || !secret) {
  console.error('Usage: SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=... node scripts/spotify-auth.mjs')
  process.exit(1)
}

const PORT = 8877
const REDIRECT = `http://127.0.0.1:${PORT}/callback`
const SCOPES = 'user-read-currently-playing user-read-recently-played user-top-read'
const authUrl =
  'https://accounts.spotify.com/authorize' +
  `?client_id=${id}&response_type=code` +
  `&redirect_uri=${encodeURIComponent(REDIRECT)}` +
  `&scope=${encodeURIComponent(SCOPES)}`

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT)
  if (url.pathname !== '/callback') {
    res.writeHead(404).end()
    return
  }
  const code = url.searchParams.get('code')
  if (!code) {
    res.end('No code in callback — did you deny access?')
    server.close()
    return
  }
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT }),
  })
  const json = await tokenRes.json()
  if (json.refresh_token) {
    res.end('Done! Check your terminal — you can close this tab.')
    console.log('\nSPOTIFY_REFRESH_TOKEN=' + json.refresh_token + '\n')
    console.log('Add it, plus SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET, to Vercel:')
    console.log('  Project → Settings → Environment Variables (all environments)')
  } else {
    res.end('Token exchange failed: ' + JSON.stringify(json))
    console.error('Token exchange failed:', json)
  }
  server.close()
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Listening on ${REDIRECT}`)
  console.log('Make sure that exact URI is registered in your Spotify app settings.')
  console.log('Opening authorization page…\n' + authUrl + '\n')
  exec(`open "${authUrl}"`)
})
