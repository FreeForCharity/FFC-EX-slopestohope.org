#!/usr/bin/env node
/**
 * Mirror assets that only appear at runtime.
 *
 * Elementor loads widget handlers as content-hashed webpack chunks whose URLs
 * are assembled in JavaScript, never written into the HTML. Static scanning
 * cannot see them, so tools/clone-wordpress.mjs misses them entirely - and a
 * missing handler is precisely what left the "pounds distributed" counter
 * stuck at 0 in production.
 *
 * This drives every cloned page in a real browser, watches for requests to
 * local paths that are not on disk, fetches those from the live WordPress
 * origin, and repeats. Repetition matters: a freshly fetched chunk routinely
 * requests further chunks, so one pass is never enough.
 *
 * Usage:
 *   node tools/sync-runtime-assets.mjs
 *   node tools/sync-runtime-assets.mjs --max-rounds=8
 */

import { createServer } from 'node:http'
import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { resolveWithin } from './lib/resolve-within.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const ORIGIN = 'https://slopestohope.com'

const args = process.argv.slice(2)
const MAX_ROUNDS =
  Number((args.find((a) => a.startsWith('--max-rounds=')) || '').replace('--max-rounds=', '')) || 6

const PAGE_PATHS = [
  '/',
  '/our-story/',
  '/team/',
  '/gallery/',
  '/contact-us/',
  '/donors/',
  '/faq/',
  '/volunteer/',
  '/donor-dashboard/',
  '/donation-confirmation/',
  '/donation-failed/',
  '/test-donate/',
  '/privacy-policy-2/',
  '/terms-of-service-2/',
]

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
}

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

function startServer() {
  const server = createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(req.url.split('?')[0])
      if (p.endsWith('/')) p += 'index.html'
      const file = resolveWithin(ROOT, p)
      if (!file) {
        res.writeHead(403).end()
        return
      }
      const body = await readFile(file)
      res.writeHead(200, {
        'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream',
      })
      res.end(body)
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not Found')
    }
  })
  return new Promise((resolve) => server.listen(0, () => resolve(server)))
}

async function fetchWithRetry(url, attempts = 4) {
  let lastErr
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'slopestohope-static-clone/1.0' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const type = res.headers.get('content-type') || ''
      const isText = /javascript|css|json|xml|svg/.test(type)
      return { body: isText ? await res.text() : Buffer.from(await res.arrayBuffer()), isText }
    } catch (err) {
      lastErr = err
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 1500 * 2 ** i))
    }
  }
  throw lastErr
}

/**
 * Strip the legacy scheme+host from any absolute URL inside a fetched text
 * asset, leaving the path. Handles the JSON-escaped form (`https:\/\/host\/x`)
 * as well, since the leading `\/` belongs to the path and must survive.
 */
function rewriteLegacy(text) {
  return text.replace(/https?:(?:\\?\/){2}(?:www\.)?slopestohope\.com/g, '')
}

async function collectMisses(base, browser) {
  const misses = new Set()

  for (const path of PAGE_PATHS) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const tab = await ctx.newPage()

    tab.on('requestfailed', (r) => {
      const url = r.url()
      if (url.startsWith(base)) misses.add(new URL(url).pathname + new URL(url).search)
    })
    tab.on('response', (r) => {
      const url = r.url()
      if (url.startsWith(base) && r.status() === 404) {
        misses.add(new URL(url).pathname + new URL(url).search)
      }
    })

    try {
      await tab.goto(base + path, { waitUntil: 'load', timeout: 45000 })
      // Exercise the page so lazily-initialised widgets request their chunks.
      await tab.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await tab.waitForTimeout(2000)
      await tab.evaluate(() => window.scrollTo(0, 0))
      await tab.waitForTimeout(500)
    } catch {
      /* a page that fails to load simply yields no misses */
    }

    await ctx.close()
  }
  return misses
}

async function main() {
  const server = await startServer()
  const base = `http://127.0.0.1:${server.address().port}`
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })

  const fetched = []
  const unavailable = []
  const seen = new Set()

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const misses = await collectMisses(base, browser)
    const fresh = [...misses].filter((m) => !seen.has(m))
    if (!fresh.length) {
      console.log(`Round ${round}: no new missing assets - mirror is stable.`)
      break
    }

    console.log(`Round ${round}: ${fresh.length} missing asset(s)`)
    for (const miss of fresh) {
      seen.add(miss)
      const pathOnly = miss.split('?')[0]
      // The path comes from a URL the cloned site's own JavaScript requested, so
      // it is not trusted input. Never fetch-and-write one that escapes public/.
      const dest = resolveWithin(ROOT, decodeURIComponent(pathOnly))
      if (!dest) {
        unavailable.push(`${pathOnly} (refused: escapes public/)`)
        console.log(`   ! ${pathOnly} (refused: escapes public/)`)
        continue
      }
      if (await exists(dest)) continue

      try {
        const { body, isText } = await fetchWithRetry(ORIGIN + miss)
        const payload = isText ? rewriteLegacy(body) : body
        await mkdir(dirname(dest), { recursive: true })
        await writeFile(dest, Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8'))
        fetched.push(pathOnly)
        console.log(`   + ${pathOnly}`)
      } catch (err) {
        unavailable.push(`${pathOnly} (${err.message})`)
        console.log(`   ! ${pathOnly} (${err.message})`)
      }
    }
  }

  await browser.close()
  server.close()

  console.log(`\nfetched     : ${fetched.length}`)
  console.log(`unavailable : ${unavailable.length}`)
  for (const u of unavailable) console.log(`   - ${u}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
