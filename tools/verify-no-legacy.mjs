#!/usr/bin/env node
/**
 * Verify the static clone is genuinely self-contained.
 *
 * Every page is loaded in a real browser with all requests to the legacy
 * WordPress host (slopestohope.com) aborted. If a page still depends on that
 * host for anything, the request shows up here as a hard failure rather than
 * silently degrading in production after the DNS cutover - which is exactly how
 * the counter-stuck-at-zero bug reached the live site.
 *
 * This is the check the fleet's clone-report.json cannot make: it scans src/href
 * attributes statically, so it cannot see URLs inside escaped Elementor JSON or
 * chunk URLs a plugin assembles at runtime. Both of those broke this site.
 *
 * Usage:
 *   npm run build && node tools/verify-no-legacy.mjs   # serves out/
 *   node tools/verify-no-legacy.mjs --base=https://slopestohope.org
 *   node tools/verify-no-legacy.mjs --shots=/tmp/shots
 */

import { createServer } from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

// Verify the built static export, not the sources: `out/` is what actually
// ships, and it is where public/ (the clone) plus anything Next generates are
// combined. Run `npm run build` first.
const REPO = join(dirname(fileURLToPath(import.meta.url)), '..')
const ROOT = join(REPO, 'out')
const LEGACY_HOST = 'slopestohope.com'

const args = process.argv.slice(2)
const BASE = (args.find((a) => a.startsWith('--base=')) || '').replace('--base=', '')
const SHOTS = (args.find((a) => a.startsWith('--shots=')) || '').replace('--shots=', '')

const PAGES = [
  { path: '/', name: 'home', expect: ['21,494', 'Slopes to Hope'] },
  { path: '/our-story/', name: 'our-story', expect: ['Our Story'] },
  { path: '/team/', name: 'team', expect: ['Team'] },
  { path: '/gallery/', name: 'gallery', expect: ['Gallery'] },
  { path: '/contact-us/', name: 'contact-us', expect: ['Contact'] },
  { path: '/donors/', name: 'donors', expect: ['Founding Donors'] },
  { path: '/faq/', name: 'faq', expect: [], forbid: ['Community Across America'] },
  { path: '/volunteer/', name: 'volunteer', expect: [] },
  { path: '/donor-dashboard/', name: 'donor-dashboard', expect: [] },
  {
    path: '/donation-confirmation/',
    name: 'donation-confirmation',
    expect: [],
    forbid: ['[give_receipt]'],
  },
  { path: '/donation-failed/', name: 'donation-failed', expect: [] },
  { path: '/test-donate/', name: 'test-donate', expect: [], forbid: ['[give_form'] },
  {
    path: '/privacy-policy/',
    name: 'privacy-policy',
    expect: ['Privacy Policy', 'Slopes to Hope'],
    forbid: ['Free For Charity', 'freeforcharity.org'],
  },
  {
    path: '/cookie-policy/',
    name: 'cookie-policy',
    expect: ['Cookie Policy'],
    forbid: ['Free For Charity', 'freeforcharity.org'],
  },
  {
    path: '/terms-of-service/',
    name: 'terms-of-service',
    expect: ['Terms of Service'],
    forbid: ['Free For Charity', 'freeforcharity.org'],
  },
  { path: '/staff/', name: 'staff-redirect', expect: [], redirectsTo: '/team/' },
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

function startServer() {
  const server = createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(req.url.split('?')[0])
      if (p.endsWith('/')) p += 'index.html'
      const file = join(ROOT, p.replace(/^\/+/, ''))
      if (!file.startsWith(ROOT)) {
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

async function main() {
  let server,
    base = BASE
  if (!base && !existsSync(ROOT)) {
    console.error(`No static export at ${ROOT}. Run \`npm run build\` first.`)
    process.exit(2)
  }
  if (!base) {
    server = await startServer()
    base = `http://127.0.0.1:${server.address().port}`
  }
  if (SHOTS) await mkdir(SHOTS, { recursive: true })

  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
  })

  const results = []
  for (const page of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const tab = await ctx.newPage()

    const legacyHits = []
    const failedRequests = []
    const localMissing = []
    const consoleErrors = []

    // Any request to the legacy host is aborted, so a surviving dependency
    // fails loudly here instead of quietly in production.
    await tab.route('**://*/**', (route) => {
      const url = route.request().url()
      if (url.includes(LEGACY_HOST)) {
        legacyHits.push(url)
        return route.abort()
      }
      return route.continue()
    })

    tab.on('requestfailed', (r) => {
      const url = r.url()
      if (url.includes(LEGACY_HOST)) return
      const entry = `${url} (${r.failure()?.errorText})`
      // A failed request to our own origin means an asset is genuinely missing
      // from the mirror - typically one Elementor builds at runtime, which no
      // amount of static scanning would have found. That is a hard failure.
      // Third-party CDNs may simply be unreachable from the test environment,
      // so those are reported but not fatal.
      if (url.startsWith(base)) localMissing.push(entry)
      else failedRequests.push(entry)
    })
    tab.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text())
    })

    let status = 'ok'
    const problems = []
    try {
      const resp = await tab.goto(base + page.path, { waitUntil: 'load', timeout: 45000 })
      if (resp && resp.status() >= 400) problems.push(`HTTP ${resp.status()}`)

      // Counters animate on scroll; drive the page so lazy content initialises.
      await tab.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await tab.waitForTimeout(2500)
      await tab.evaluate(() => window.scrollTo(0, 0))
      await tab.waitForTimeout(800)

      if (page.redirectsTo) {
        const got = new URL(tab.url()).pathname
        if (got !== page.redirectsTo)
          problems.push(`redirect went to ${got}, expected ${page.redirectsTo}`)
      }

      const text = await tab.evaluate(() => document.body.innerText)
      for (const needle of page.expect || []) {
        if (!text.includes(needle)) problems.push(`missing expected text: "${needle}"`)
      }
      for (const needle of page.forbid || []) {
        if (text.includes(needle)) problems.push(`contains forbidden text: "${needle}"`)
      }

      if (SHOTS) await tab.screenshot({ path: join(SHOTS, `${page.name}.png`), fullPage: false })
    } catch (err) {
      problems.push(`navigation error: ${err.message}`)
    }

    if (legacyHits.length) problems.push(`${legacyHits.length} request(s) to ${LEGACY_HOST}`)
    if (localMissing.length) problems.push(`${localMissing.length} missing local asset(s)`)
    if (problems.length) status = 'FAIL'

    results.push({
      page,
      status,
      problems,
      legacyHits,
      failedRequests,
      localMissing,
      consoleErrors,
    })
    await ctx.close()
  }

  await browser.close()
  if (server) server.close()

  console.log(`\nVerified against ${base}\n`)
  let failures = 0
  for (const r of results) {
    const mark = r.status === 'ok' ? 'PASS' : 'FAIL'
    if (r.status !== 'ok') failures++
    console.log(`${mark}  ${r.page.path}`)
    for (const p of r.problems) console.log(`        ! ${p}`)
    for (const u of r.legacyHits.slice(0, 5)) console.log(`        legacy: ${u}`)
    for (const u of r.localMissing) console.log(`        MISSING LOCAL: ${u}`)
    for (const u of r.failedRequests.slice(0, 3))
      console.log(`        third-party unreachable: ${u}`)
  }

  console.log(`\n${results.length - failures}/${results.length} pages passed`)
  if (failures) process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
